var http = require('http'),
    async = require('async'),
    xml2js = require('xml2js'),
    querystring = require('querystring'),
    moment = require('moment'),
    Transit = require('transportation'),
    path = require('path'),
    events = require('events'),
    predictions = {},
    logger = console.log;

var gtfs = new events.EventEmitter();
gtfs.noPickup = [];

// Import the schedule from GTFS data.
var transit = new Transit();
var gtfsPath = path.resolve(__dirname, '../static/gtfs');

transit.importGTFS(gtfsPath, function onEnd () {
    var noPickup = [];

    var routes = transit.agencies.ucsf.routes;

    routes.ids.forEach(function (routeId) { 
        routes[routeId].trips.ids.forEach(function (tripId) {
            var scheduleFragment = routes[routeId].trips[tripId].stops.ids.filter(function (stopId) {
                // Find all the times that do not have a pickup.
                return routes[routeId].trips[tripId].stops[stopId].pickupType === 1;
            });
            noPickup = noPickup.concat(scheduleFragment.map(function (stopId) {
                var myTimestamp = moment(routes[routeId].trips[tripId].stops[stopId].arrival, 'hh:mm:ss').format('X') - moment('00:00:00', 'hh:mm:ss').format('X'); 
                return {
                    route: routeId, 
                    trip: tripId, 
                    stop: routes[routeId].trips[tripId].stops[stopId]._stopId, 
                    arrival: myTimestamp
                };
            }));
        });
    });
    gtfs.noPickup = noPickup;
    gtfs.emit('load');
});

// Useful for testing. Could be useful if predictions get waaaay out of date due to NextBus outage, for example.
exports.clearPredictions = function() {
    predictions = {};
};

// Common function to get all stops and call callback() with results
var stops = function(callback, options) {
    'use strict';

    options.useParentStation = options.hasOwnProperty('useParentStation') ? options.useParentStation : true;

    var otpOptions = {
        host: 'localhost',
        path: '/otp/routers/default/index/stops',
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

    if (options.path) {
        otpOptions.path = options.path;
    }

    var data = '';

    http.get(otpOptions, function(resp) {
        if (resp.statusCode !== 200 && resp.statusCode !== 404) {
            var errorMsg = 'shuttle/stops error: code ' + resp.statusCode;
            logger(errorMsg);
            return callback({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            var rv = {stops: []};
            if (resp.statusCode === 200) {
                var dataObject;

                try {
                    dataObject = JSON.parse(data);
                } catch (e) {
                   logger('shuttle/stops error: Exception thrown while parsing JSON');
                   logger(e);
                   //TODO: Set an error message for the API consumer inside of dataObject or rv?
                }

                if (! (dataObject instanceof Array)) {
                    dataObject = [];
                }

                rv.stops = dataObject.map(function (value) {
                    var rv = {};
                    if (value.id) {
                        rv.id = {id: value.id.substr(5), agencyId: 'ucsf'};
                        rv.stopName = value.name;
                        rv.stopLat = value.lat;
                        rv.stopLon = value.lon;
                        if (value.cluster) {
                            rv.parentStation = value.cluster;
                        }
                    }
                    return rv;
                });

                // Remove malformed entries with no required id property.
                rv.stops = rv.stops.filter(function (value) {
                    return value.id;
                });
                
                if (options.useParentStation) {
                    // Sad hack: Querying for clusters/parent stations not working with our data in OTP 0.14.0
                    // So, postprocess here. Bummer. Hardcoding names. Yuck.
                    var parentStations = {
                        'Parnassus': {
                            id: {
                                id: 'Parnassus',
                                agencyId: 'ucsf'
                            },
                            stopName: 'Parnassus Campus',
                            stopLat: 37.763174,
                            stopLon: -122.459176
                        },
                        'MB': {
                            id: {
                                id: 'MB',
                                agencyId: 'ucsf'
                            },
                            stopName: 'Mission Bay Campus',
                            stopLat: 37.76793,
                            stopLon: -122.391009
                        },
                        '100 Buchanan': {
                            id: {
                                id: '100 Buchanan',
                                agencyId: 'ucsf'
                            },
                            stopName: 'Buchanan Dental Center',
                            stopLat: 37.770791,
                            stopLon: -122.426684
                        },
                        '2300 Harrison': {
                            id: {
                                id: '2300 Harrison',
                                agencyId: 'ucsf'
                            },
                            stopName: '20th & Alabama',
                            stopLat: 37.759072,
                            stopLon:-122.411562
                        }
                    };
                    var processedParentStations = [];
                    rv.stops = rv.stops.reduce(function (accumulator, value) {
                        if (parentStations[value.parentStation]) {
                            if (processedParentStations.indexOf(value.parentStation) === -1) {
                                processedParentStations.push(value.parentStation);
                                accumulator.push(parentStations[value.parentStation]);
                            }
                        } else {
                            accumulator.push(value);
                        }

                        return accumulator;
                    }, []);
                 }
            } else {
                rv.route = {};
            }
            return callback(rv);
        });
    }).on('error', function(e){
        logger('shuttle/stops error: ' + e.message);
        return callback({error: e.message});
    });
};

var updatePredictionsAsync = function (callback) {

    var updateCallback = function (result) {
        var rv = {
            predictions: []
        };

        if (typeof result === 'object' && result.body && result.body.predictions instanceof Array) {
            var p = result.body.predictions,
                routeId,
                stopId,
                times,
                mapCallback = function (value) { return value.$.minutes; },
                filterCallback = function (value) { return Number.isInteger(parseInt(value, 10)); };
            for (var i=0, l=p.length; i<l; i++) {
                if (! p[i].$) {
                    continue;
                }
                routeId = p[i].$.routeTag;
                stopId = p[i].$.stopTag;
                times = [];
                if (p[i].direction && p[i].direction[0] && p[i].direction[0].prediction && p[i].direction[0].prediction instanceof Array) {
                    times = p[i].direction[0].prediction.map(mapCallback).filter(filterCallback);
                }

                rv.predictions.push({routeId: routeId, stopId: stopId, times: times});
            }

            rv.timestamp = Date.now();
            predictions = rv;
        } else {
            predictions.timestamp = Date.now();
        }
        callback(predictions);
    };

    var rawData = '';

    // If the cache is less than 10 seconds old, don't retrieve it again.
    // More than once every ten seconds would violate NextBus terms of service.
    if (predictions.timestamp && Date.now() - predictions.timestamp < 10 * 1000) {
        process.nextTick(callback.bind(null, predictions));
        return;
    }

    // TODO: Instead of hard-coding the shuttles and locations, retrieve via
    //    http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ucsf
    // Not doing that right now because the Yellow shuttle data there defy sanity.
    // Could omit yellow weirdness by ignoring any routes that have an underscore.
    var options = {
        hostname: 'webservices.nextbus.com',
        path: '/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf' +
            '&stops=grey%7Cmissb4we' +
            '&stops=grey%7Cparlppi' +
            '&stops=grey%7Chospital' +
            '&stops=blue%7Cmissb4we' +
            '&stops=blue%7Chospital' +
            '&stops=blue%7Cparlppi' +
            '&stops=blue%7Cmtzion' +
            '&stops=blue%7Csfgh' +
            '&stops=gold%7Cmissb4we' +
            '&stops=gold%7Chospital' +
            '&stops=gold%7Csfgh' +
            '&stops=gold%7Cparlppi' +
            '&stops=gold%7Cmtzion' +
            '&stops=bronze%7C75behr' +
            '&stops=bronze%7Cparlppi' +
            '&stops=bronze%7Csurgedown' +
            '&stops=black%7Clhts' +
            '&stops=black%7Cmtzion' +
            '&stops=black%7Clibrary' +
            '&stops=tan%7Clhts' +
            '&stops=tan%7Cmtzion' +
            '&stops=tan%7Clibrary' +
            '&stops=lime%7Clibrary' +
            '&stops=lime%7Cmcb' +
            '&stops=lime%7Cbuchaneb' +
            '&stops=lime%7Cbuchanwb'
    };

    http.get(options, function (resp) {
        resp.on('data', function (chunk) {
            rawData += chunk;
        });

        resp.on('error', function (e) {
            //Update time stamp but otherwise empty cache so we don't have stale data.
            predictions = {
                timestamp: Date.now()
            };
            logger('Predictions error: ' + e);
            callback(predictions);
        });

        resp.on('end', function () {
            var parser = new xml2js.Parser();
            parser.on('end', updateCallback);
            parser.on('error', function (err) {
                logger(err);
                //Update time stamp but otherwise empty cache so we don't have stale data.
                predictions = {
                    timestamp: Date.now()
                };
                callback(predictions);
            });
            parser.parseString(rawData);
        });
    })
    .on('error', function (e) {
        logger('NextBus XML retrieval error:');
        logger(e);
        //Update time stamp but otherwise empty cache so we don't have stale data.
        predictions = {
            timestamp: Date.now()
        };
        callback(predictions);
    });
};

exports.stops = function(req, res) {
    'use strict';

    var options = {};
    if (req.query.routeId) {
        options = {
            path: '/otp/routers/default/index/routes/ucsf%3A' + encodeURIComponent(req.query.routeId) + '/stops?detail=true&refs=true',
            useParentStation: false
        };
    }

    stops(
        function (results) {
            var routeId = req.query.routeId || '';
            // Sad hack to keep info from old OTP API.
            var routeShortName = routeId.substr(0,1).toUpperCase() + routeId.substr(1);
            if (routeShortName === 'Va') {
                routeShortName = 'VA';
            }
            var routeLongName = '';
            if (transit.agencies.ucsf && transit.agencies.ucsf.routes[routeId]) {
                routeLongName = transit.agencies.ucsf.routes[routeId].longName;
            }
            // Add route info.
            if (routeId && results.stops && results.stops.length > 0) {
                results.route = {id:{id: routeId}, routeShortName: routeShortName, routeLongName: routeLongName};
            }

            // Bride Of Sad Hack #47: Remove Library and ACC from Bronze results,
            // as those are drop-off only and won't show up in the interface.
            // They are used by the trip planner, though, so we can't just remove them from the source data.
            if (results.stops && results.route && results.route.id && results.route.id.id === 'bronze') {
                results.stops = results.stops.filter(function (el) {
                    return  ['paracc','library'].indexOf(el.id.id)===-1;
                });
            }

            res.json(results);
        },
        options
    );
};

exports.routes = function(req, res) {
    'use strict';

    var host = 'localhost',
        port = 8080,
        headers = {'Content-Type':'application/json'};

    // Parameter: stopId to get just the routes that service a particular stop
    var query = {};

    // Stupid Hack #3. See https://github.com/openplans/OpenTripPlanner/issues/1057
    // If parent station, let's search for routes in all stops in the parent station.
    var parentStationToChildStationForStupidHackNumberThree = {
        'Parnassus': ['library', 'parlppi', 'paracc'],
        'MB': ['missb4th', 'missb4we'],
        '2300 Harrison': ['23harrnb_ib', '23harrsb_ob'],
        '100 Buchanan': ['buchaneb', 'buchanob']
    };

    var foundRoutes = [];

    var routes = function (stopId, callback) {
        var otpOptions = {
            host:host,
            port:port,
            headers:headers
        };

        otpOptions.path = stopId ?
        '/otp/routers/default/index/stops/ucsf:' + encodeURIComponent(stopId) + '/routes' :
        '/otp/routers/default/index/routes';

        http.get(otpOptions, function(resp) {
            var data = '';
            if (resp.statusCode !== 200) {
                var errorMsg = 'shuttle/routes error: code ' + resp.statusCode;
                logger(errorMsg);
                if (callback) {
                    callback({error: errorMsg});
                } else {
                    res.json({error: errorMsg});
                }
            }
            resp.on('data', function(chunk){
                data += chunk;
            });
            resp.on('end', function() {
                if (resp.statusCode === 200) {
                    var results;
                    try {
                        results = JSON.parse(data);
                    } catch (e) {
                        logger('shuttle/routes error: JSON parse failed');
                        logger(e);
                        results = [];
                    }
                    var rv = {};
                    rv.routes = results.map(function (value) {
                        return {
                            id: {id: value.id.substr(5)},
                            routeShortName: value.shortName,
                            routeLongName: value.longName
                        };
                    });

                    // Yet another sad ugly hack: remove Mt. Zion Express because WTF it only runs like twice a year
                    rv.routes = rv.routes.filter(function (e) {
                        return e.id.id !== 'mtzionexpress';
                    });
                    foundRoutes = foundRoutes.concat(rv.routes);

                    if (callback) {
                        callback();
                    } else {
                        res.json(rv);
                    }
                }
            });
        }).on('error', function(e){
            logger('shuttle/routes error: ' + e.message);
            if (callback) {
                callback({error: e.message});
            } else {
                res.json({error: e.message});
            }
        });

    };

    var myStop;
    if (req.query.stopId) {
        query.id = parentStationToChildStationForStupidHackNumberThree[req.query.stopId] ||
            [req.query.stopId];
        async.parallel([
            function (callback) {
                async.each(query.id, routes, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        // sort so we can deduplicate results from ugly hack number three
                        foundRoutes.sort(function(a,b) { return a.id.id > b.id.id; });
                        for(var l = foundRoutes.length - 1; l>0; --l) {
                            if (foundRoutes[l].id.id === foundRoutes[l-1].id.id) {
                                foundRoutes.splice(l,1);
                            }
                        }
                        callback();
                    }
                });
            },
            function (callback) {
                stops( function( allStops ) {
                    if (allStops.stops) {
                        myStop = allStops.stops.filter(function ( obj ) { return obj.id.id === req.query.stopId; }).pop();
                        callback();
                    } else {
                        callback({error: 'error looking up stops'});
                    }
                }, {});
            }
        ], function (e) {
            if (e) {
                return res.json(e);
            }
            res.json({stop: myStop, routes: foundRoutes});
        });
    } else {
        routes();
    }
};

exports.times = function(req, res) {
    'use strict';

    var timestamp = parseInt(req.query.startTime, 10);
    var dateString = moment(timestamp).format('YYYYMMDD');    

    var otpOptions = {
        host: 'localhost',
        path: '/otp/routers/default/index/stops/ucsf%3A' + encodeURIComponent(req.query.stopId) + '/stoptimes/' + encodeURIComponent(dateString) + '?details=true&refs=true',
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

    var data = '';

    http.get(otpOptions, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = 'shuttle/times error: code ' + resp.statusCode;
            logger(errorMsg);
            res.json({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            var result;
            if (resp.statusCode === 200) {
                try {
                    result = JSON.parse(data);
                } catch (e) {
                    logger('shuttle/times JSON.parse error: ', e);
                    return res.json({error: e.message});
                }
                var rv = {};
                if (result instanceof Array) {
                    rv.times = result.filter(function(value) {
                        return value.pattern && value.pattern.id && value.pattern.id.indexOf('ucsf:' + req.query.routeId + ':') === 0;
                    });
                    var processedPatterns = [];
                    rv.times = rv.times.reduce(function (accumulator, value) {
                        if (processedPatterns.indexOf(value.pattern.id) === -1) {
                            processedPatterns.push(value.pattern.id);

                            value.times = value.times.map(function (entry) {

                                if (!entry.direction && entry.serviceDay && entry.scheduledDeparture && transit.agencies.ucsf) {
                                    var timeToMatch = moment.unix(entry.serviceDay + entry.scheduledDeparture).format('HH:mm:ss');
                                    var tripIdToMatch = entry.tripId.substr(5);
                                    var stopTime = transit.agencies.ucsf.routes[req.query.routeId].trips[tripIdToMatch].stops.findAll(function (stopTime) {
                                        return stopTime._stopId === req.query.stopId;
                                    }).find(function (stopTime) {
                                        return stopTime.departure === timeToMatch;
                                    });
                                    entry.direction = stopTime ? stopTime.stopHeadsign : undefined;
                                }
                                return entry;
                            });
                            return accumulator.concat(value.times);
                        }
                        return accumulator;
                    }, []);

                    rv.times.sort(function (value1, value2) {
                        return value1.scheduledDeparture - value2.scheduledDeparture;
                    });

                    var respond = function () {
                        var omitTimes = gtfs.noPickup.filter(function (value) {
                            return req.query.routeId === value.route && req.query.stopId === value.stop;
                        }).map(function (value) {
                            return value.arrival;
                        });

                        rv.times = rv.times.filter(function (value) {
                            return omitTimes.indexOf(value.scheduledArrival) === -1;
                        }).map(function (value) {
                            return {
                                time: value.serviceDay + value.scheduledDeparture,
                                direction: value.direction
                            };
                        });
                        res.json(rv);
                    };

                    // Sad Horrible Hack #4 or something. otp-0.17.0 returns stops with pickup_type==1 which means drop-off only.
                    // It does not provide a way to distinguish between those and other stop times.
                    // We don't want to show shuttle stop times in the schedule if the user cannot board.
                    // So, let's filter them out.

                    if (gtfs.noPickup.length === 0) {
                        gtfs.on('load', respond);
                    } else {
                        respond();
                    }
                    
                } else {
                    logger('shuttle/times probable error:', result);
                    res.json(result);
                }
            }
        });
    }).on('error', function(e){
        logger('shuttle/times error: ' + e.message);
        res.json({error: e.message});
    });
};

exports.plan = function(req, res) {
    'use strict';

    var allResults = [];
    var metadata = {};

    var callback = function(err) {
        if (err) {
            res.json(err);
        } else {
            if (metadata.plan) {

                var toId,
                    itinerary,
                    firstLeg;

                for(var l = allResults.length - 1; l>=0; --l) {
                    // Remove any "walk to <starting point>"
                    itinerary = allResults[l];
                    firstLeg = itinerary.legs[0];
                    if (firstLeg.to.stopId) {
                        toId = firstLeg.to.stopId.agencyId + ':' + firstLeg.to.stopId.id;
                        if (firstLeg.mode==='WALK') {
                            allResults.splice(l,1);
                            continue;
                        }
                    }
                }

                // Sort results
                var compareOn = req.query.arriveBy==='true' ? 'endTime' : 'startTime';
                var ascendingSort = req.query.arriveBy==='true' ? -1 : 1;
                var compare = function (a,b) {
                    // If one shuttle both arrives earlier and leaves later than another,
                    //   then it should be favored no matter what.
                    if ((a.endTime <= b.endTime) === (b.startTime <= a.startTime)) {
                        return b.startTime - a.startTime;
                    }

                    if (a[compareOn] < b[compareOn]) {
                        return -ascendingSort;
                    }
                    if (a[compareOn] > b[compareOn]) {
                        return ascendingSort;
                    }
                    return 0;
                };
                allResults.sort(compare);

                metadata.plan.itineraries = allResults;
            }
            res.json(metadata);
        }
    };

    var options = {
        fromPlace:req.query.fromPlace,
        toPlace:req.query.toPlace,
        mode:'TRANSIT,WALK'
    };

    var otpOptions = {
        host: 'localhost',
        path: '/otp/routers/default/plan?minTransferTime=60&',
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

    var query = {};
    // Useful parameters the user can send:
    // fromPlace & toPlace are required.
    // date is required if time is set. default to current time and date.
    // arriveBy defaults to "false"
    if (req.query.date) {
        query.date = req.query.date;
    }
    if (req.query.time) {
        query.time = req.query.time;
    }
    if (req.query.arriveBy) {
        query.arriveBy = req.query.arriveBy;
    }

    query.fromPlace = String(options.fromPlace).replace('_', ':');
    query.toPlace = String(options.toPlace).replace('_', ':');
    query.mode = options.mode;

    otpOptions.path += querystring.stringify(query);

    var processResults = function(resp) {
        var data = '';
        if (resp.statusCode !== 200) {
            var errorMsg = 'shuttle/plan error: code ' + resp.statusCode;
            logger(errorMsg);
            callback({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                var rv = JSON.parse(data);
                if (rv.plan && rv.plan.itineraries) {
                    metadata.plan = rv.plan;
                    allResults.push.apply(allResults, rv.plan.itineraries);
                }
                callback();
            }
        });
    };

    http.get(otpOptions,
        processResults
    ).on('error', function(e){
        logger('shuttle/plan error: ' + e.message);
        callback({error: e.message});
    });
};

exports.predictions = function(req, res) {
    'use strict';

    var rv = {times:[]};

    if (req.query.stopId && req.query.routeId) {
        updatePredictionsAsync(function (result) {
            if (result.predictions && result.predictions instanceof Array) {
                var needle = result.predictions.filter(function (value) {
                    return value.routeId===req.query.routeId && value.stopId===req.query.stopId;
                });
                if (needle[0]) {
                    rv.times = needle[0].times;
                }
            }
            res.json(rv);
        });
    } else {
        res.json(rv);
    }
};
