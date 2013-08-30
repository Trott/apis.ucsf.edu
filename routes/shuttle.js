var http = require('http'),
    querystring = require('querystring'),
    async = require('async'),
    xml2js = require('xml2js'),
    predictions = {};

// Common function to get all stops and call callback() with results
var stops = function(callback, options) {
    'use strict';

    options = options || {};
    options.property = options.property || "stops";
    options.useParentStation = options.hasOwnProperty("useParentStation") ? options.useParentStation : true;

    var otpOptions = {
        host: "localhost",
        path: "/opentripplanner-api-webapp/ws/transit/stopsInRectangle?extended=true",
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

    if (options.path) {
        otpOptions.path = options.path;
    }

    var data = '';

    http.get(otpOptions, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = "shuttle/stops error: code " + resp.statusCode;
            console.log(errorMsg);
            callback({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                var filtered = [],
                    dataObject = JSON.parse(data),
                    rv = {stops: []};
                if (dataObject.hasOwnProperty(options.property) && dataObject[options.property] instanceof Array) {
                    if (options.useParentStation) {
                        for (var i=0; i<dataObject[options.property].length; i++) {
                            if (dataObject[options.property][i].hasOwnProperty('parentStation') && dataObject[options.property][i].parentStation === null) {
                                filtered.push(dataObject[options.property][i]);
                            }
                        }
                        rv.stops = filtered;
                    } else {
                        if (dataObject[options.property][0]) {
                            rv.route = dataObject[options.property][0].route || {};
                            rv.stops = dataObject[options.property][0].stops || [];
                        }
                    }
                }
                callback(rv);
            }
        });
    }).on("error", function(e){
        console.log("shuttle/stops error: " + e.message);
        callback({error: e.message});
    });
};

var updatePredictionsAsync = function (callback) {

    var updateCallback = function (result) {
        var rv = {
            predictions: []
        };

        if (typeof result === "object" && result.body && result.body.predictions instanceof Array) {
            var p = result.body.predictions,
                routeId,
                stopId,
                times,
                mapCallback = function (value) { return value['$'] && value['$'].minutes; };
            for (var i=0, l=p.length; i<l; i++) {
                routeId = p[i]['$'].routeTag;
                stopId = p[i]['$'].stopTag;
                times = [];
                if (p[i].direction && p[i].direction[0] && p[i].direction[0].prediction && p[i].direction[0].prediction instanceof Array) {
                    times = p[i].direction[0].prediction.map(mapCallback);
                }

                // Why oh why are the Black and Tan shuttles different from each other?
                if (stopId === "library_a") {
                    stopId = "library";
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
        callback(predictions);
        return;
    }

    // TODO: Instead of hard-coding the shuttles and locations, retrieve via
    //    http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ucsf
    // Not doing that right now because the Black/Tan shuttles (see above) and Yellow shuttle
    //     data there defy sanity.
    var options = {
        hostname: "webservices.nextbus.com",
        path: "/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf" +
            "&stops=grey%7Cmissb4we" +
            "&stops=grey%7Cparlppi" +
            "&stops=blue%7Cmissb4th" +
            "&stops=blue%7Cparlppi" +
            "&stops=blue%7Cmtzion" +
            "&stops=blue%7Csfgh" +
            "&stops=gold%7Cmissb4we" +
            "&stops=gold%7Csfgh" +
            "&stops=gold%7Clibrary" +
            "&stops=gold%7Cmtzion" +
            "&stops=bronze%7C75behr" +
            "&stops=bronze%7Cparlppi" +
            "&stops=bronze%7Cparacc" +
            "&stops=bronze%7Clibrary" +
            "&stops=bronze%7Csurgedown" +
            "&stops=black%7Clhts" +
            "&stops=black%7Cmtzion" +
            "&stops=black%7Clibrary_a" +
            "&stops=tan%7Clhts" +
            "&stops=tan%7Cmtzion" +
            "&stops=tan%7Clibrary"
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
            console.dir('Predictions error: ' + e);
            callback(predictions);
        });

        resp.on('end', function () {
            var parser = new xml2js.Parser();
            parser.on('end', updateCallback);
            parser.on('error', function (err) {
                console.dir(err);
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
        console.log('NextBus XML retrieval error:');
        console.dir(e);
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
        var routeIdOption = {id: req.query.routeId};
        options = {
            path: "/opentripplanner-api-webapp/ws/transit/routeData?agency=ucsf&references=true&extended=true&" +
                querystring.stringify(routeIdOption),
            property: "routeData",
            useParentStation: false
        };
    }

    stops(
        function (results) {
            res.send(results);
        },
        options
    );
};

exports.routes = function(req, res) {
    'use strict';

    var host = "localhost",
        port = 8080,
        headers = {'Content-Type':'application/json'};

    // Parameter: stopId to get just the routes that service a particular stop
    var query = {};

    // Stupid Hack #3. See https://github.com/openplans/OpenTripPlanner/issues/1057
    // If parent station, let's search for routes in all stops in the parent station.
    var parentStationToChildStationForStupidHackNumberThree = {
        "Parnassus": ["library", "parlppi", "paracc", "ER"],
        "MB": ["missb4th", "missb4we"],
        "2300 Harrison": ["23harrnb_ib", "23harrsb_ob"],
        "100 Buchanan": ["buchaneb", "buchanob"]
    };

    var foundRoutes = [];

    var routes = function (stopId, callback) {

        var otpOptions = {
            host:host,
            port:port,
            headers:headers
        };

        otpOptions.path = stopId ?
        "/opentripplanner-api-webapp/ws/transit/routesForStop?agency=ucsf&" + querystring.stringify({id:stopId}) :
        "/opentripplanner-api-webapp/ws/transit/routes?agency=ucsf&";

        http.get(otpOptions, function(resp) {
            var data = "";
            if (resp.statusCode !== 200) {
                var errorMsg = "shuttle/routes error: code " + resp.statusCode;
                console.log(errorMsg);
                if (callback) {
                    callback({error: errorMsg});
                } else {
                    res.send({error: errorMsg});
                }
            }
            resp.on('data', function(chunk){
                data += chunk;
            });
            resp.on('end', function() {
                if (resp.statusCode === 200) {
                    var rv = JSON.parse(data);
                    if (rv.routes) {
                        foundRoutes = foundRoutes.concat(rv.routes);
                    }

                    if (callback) {
                        callback();
                    } else {
                        res.send(data);
                    }
                }
            });
        }).on("error", function(e){
            console.log("shuttle/routes error: " + e.message);
            if (callback) {
                callback({error:e.message});
            } else {
                res.send({error: e.message});
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
                var filteredStops;
                stops( function( allStops ) {
                    if (allStops.stops) {
                        myStop = allStops.stops.filter(function ( obj ) { return obj.id.id === req.query.stopId; }).pop();
                        callback();
                    } else {
                        callback({error:"error looking up stops"});
                    }
                });
            }
        ], function (err) {
            res.send({stop: myStop, routes: foundRoutes});
        });
    } else {
        routes();
    }
};

exports.times = function(req, res) {
    'use strict';

    var otpOptions = {
        host: "localhost",
        path: "/opentripplanner-api-webapp/ws/transit/stopTimesForStop?agency=ucsf&extended=true&",
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

    var data = "";

    var pathOptions = {};
    // routeId is optional. Other parameters are required.
    pathOptions.id = req.query.stopId;
    pathOptions.routeId = req.query.routeId;
    pathOptions.startTime = req.query.startTime;
    pathOptions.endTime = req.query.endTime;
    otpOptions.path += querystring.stringify(pathOptions);

    http.get(otpOptions, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = "shuttle/times error: code " + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                var result = JSON.parse(data);
                var rv = {};
                if (result.stopTimes) {
                    rv.times = result.stopTimes.filter(function(el) { return el.phase && el.phase==="departure"; });
                } else {
                    rv = result;
                }
                res.send(rv);
            }
        });
    }).on("error", function(e){
        console.log("shuttle/times error: " + e.message);
        res.send({error: e.message});
    });
};

exports.plan = function(req, res) {
    'use strict';

    // ACHTUNG! TOTALLY SAD UGLY HACK!
    // OTP will not route to a destination that is a parent station.
    // See https://github.com/openplans/OpenTripPlanner/issues/1049
    // So, for parent stations in our GTFS data, let's substitute in
    // the appropriate child stations, sometimes based on the other endpoint.
    // Sadly, this means that we have GTFS data here. Blech.
    // Also, we sometimes have to do multiple queries.

    // So, for the sad ugly hack, this maps parent stations to a child station.
    var parentStationToChildStation = {
        "ucsf_Parnassus": function (endpoint) {
            switch (endpoint) {
                case "ucsf_75behr":
                case "ucsf_surgedown":
                    return ["ucsf_paracc", "ucsf_parlppi"];
                case "ucsf_parkezar":
                case "ucsf_veteran":
                    return ["ucsf_ER"];
                case "ucsf_3360 Geary":
                case "ucsf_lhts":
                case "ucsf_sfgh":
                    return ["ucsf_parlppi", "ucsf_library"];
                case "ucsf_mtzion":
                    return ["ucsf_parlppi", "ucsf_library"];
                default:
                    return ["ucsf_parlppi"];
            }
        },
        "ucsf_MB": function (endpoint) {
            return ["ucsf_missb4th","ucsf_missb4we"];
        },
        "ucsf_2300 Harrison": function (endpoint) {
            return ["ucsf_23harrnb_ib", "ucsf_23harrsb_ob"];
        },
        "ucsf_100 Buchanan": function (endpoint) {
            return ["ucsf_buchanwb", "ucsf_buchaneb"];
        }
    };

    var uglyHack = function (pointA, pointB) {
        if (typeof parentStationToChildStation[pointA] === "function") {
             return parentStationToChildStation[pointA](pointB);
        } else {
            return [pointA];
        }
    };

    var fromPlaces = [null],
        toPlaces = [null];
    if (req.query.fromPlace && req.query.toPlace) {
        fromPlaces = uglyHack(req.query.fromPlace, req.query.toPlace);
        toPlaces = uglyHack(req.query.toPlace, req.query.fromPlace);
    }

    // Thanks to sad ugly hack, we have to build an array of functions to
    // run to retrieve potential routes.
    var combined = [];
    for (var i=0; i<fromPlaces.length; i++) {
        for (var j=0; j<toPlaces.length; j++) {
            combined.push({fromPlace:fromPlaces[i], toPlace:toPlaces[j], mode:'TRANSIT,WALK'});
            // Ugly Hack #2: Works around https://github.com/openplans/OpenTripPlanner/issues/1054
            combined.push({fromPlace:fromPlaces[i], toPlace:toPlaces[j], mode:'TRANSIT', hack:true});
        }
    }

    var allResults = [];
    var uglyHackNumberTwoResults = [];
    var metadata = {};
    var plan = function (options, callback) {
        var otpOptions = {
            host: "localhost",
            path: "/opentripplanner-api-webapp/ws/plan?minTransferTime=60&",
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

        query.fromPlace = options.fromPlace;
        query.toPlace = options.toPlace;
        query.mode = options.mode;
        query.hack = options.hack;

        otpOptions.path += querystring.stringify(query);

        var processResults = function(resp) {
            var data = "";
            if (resp.statusCode !== 200) {
                var errorMsg = "shuttle/plan error: code " + resp.statusCode;
                console.log(errorMsg);
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
                        if (rv.requestParameters && rv.requestParameters.hack==="true") {
                            uglyHackNumberTwoResults.push.apply(uglyHackNumberTwoResults, rv.plan.itineraries);
                        } else {
                            allResults.push.apply(allResults, rv.plan.itineraries);
                        }
                    }
                    callback();
                }
            });
        };

        http.get(otpOptions,
            processResults
        ).on("error", function(e){
            console.log("shuttle/plan error: " + e.message);
            callback({error: e.message});
        });
    };

    async.each(combined, plan, function(err) {
        if (err) {
            res.send(err);
        } else {
            if (metadata.plan) {

                var toId,
                    itinerary,
                    firstLeg,
                    penultimateLeg,
                    lastLeg;

                // If we didn't get anything from the ordinary request but got something from ugly hack #2, use it.
                if (allResults.length === 0 && uglyHackNumberTwoResults.length > 0) {
                    allResults = uglyHackNumberTwoResults;
                }

                for(var l = allResults.length - 1; l>=0; --l) {
                    // Remove any "walk to <starting point>" resulting from ugly hack
                    itinerary = allResults[l];
                    firstLeg = itinerary.legs[0];
                    if (firstLeg.to.stopId) {
                        toId = firstLeg.to.stopId.agencyId + '_' + firstLeg.to.stopId.id;
                        if (firstLeg.mode==="WALK") {
                            allResults.splice(l,1);
                            continue;
                        }
                    }

                    // Remove any "walk from ending point to other ending point" resulting from ugly hack
                    if (itinerary.legs.length > 1) {
                        penultimateLeg = itinerary.legs[itinerary.legs.length - 2];
                        lastLeg = itinerary.legs[itinerary.legs.length - 1];
                        if (penultimateLeg.to.stopId) {
                            toId = penultimateLeg.to.stopId.agencyId + '_' + penultimateLeg.to.stopId.id;

                            if (lastLeg.mode==="WALK" && toPlaces.indexOf(toId)!==-1) {
                                allResults.splice(l,1);
                                continue;
                            }
                        }
                    }
                }

                // Sort merged results from ugly hack
                var compareOn = req.query.arriveBy==='true' ? 'endTime' : 'startTime';
                var ascendingSort = req.query.arriveBy==='true' ? -1 : 1;
                var compare = function (a,b) {
                    // If one shuttle both arrives earlier and leaves later than another,
                    //   then it should be favored no matter what.
                    if ((a['endTime'] <= b['endTime']) === (b['startTime'] <= a['startTime'])) {
                        return b['startTime'] - a['startTime'];
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
            res.send(metadata);
        }
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
            res.send(rv);
        });
    } else {
        res.send(rv);
    }
};
