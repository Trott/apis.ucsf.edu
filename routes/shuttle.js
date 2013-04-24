var http = require('http'),
    querystring = require('querystring'),
    async = require('async');

// Common function to get all stops and call callback() with results
var stops = function(callback) {
    "use strict";

    var otpOptions = {
        host: "apis.ucsf.edu",
        path: "/opentripplanner-api-webapp/ws/transit/stopsInRectangle?extended=true",
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

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
                    rv = JSON.parse(data);
                if (rv.hasOwnProperty('stops') && rv.stops instanceof Array) {
                    for (var i=0; i<rv.stops.length; i++) {
                        if (rv.stops[i].hasOwnProperty('parentStation') && rv.stops[i].parentStation === null) {
                            filtered.push(rv.stops[i]);
                        }
                    }
                }
                rv.stops = filtered;
                callback(rv);
            }
        });
    }).on("error", function(e){
        console.log("shuttle/stops error: " + e.message);
        callback({error: e.message});
    });
};

exports.stops = function(req, res) {
    "use strict";
    stops(function (results) {
        res.send(results);
    });
};

exports.routes = function(req, res) {
    "use strict";

    var host = "apis.ucsf.edu",
        port = 8080,
        headers = {'Content-Type':'application/json'};

    // Parameter: stopId to get just the routes that service a particular stop
    var query = {};

    // Stupid Hack #3. See https://github.com/openplans/OpenTripPlanner/issues/1057
    // If parent station, let's search for routes in all stops in the parent station.
    var parentStationToChildStationForStupidHackNumberThree = {
        "Parnassus": ["Parnassus Library", "LPPI", "Parnassus ACC", "E/R"],
        "MB": ["MBE", "MBW"],
        "2300 Harrison": ["2300 Harrison N", "2300 Harrison S"],
        "100 Buchanan": ["100 Buchanan N", "100 Buchanan S"]
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

exports.plan = function(req, res) {
    "use strict";

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
                case "ucsf_Aldea Housing":
                case "ucsf_Surge/Woods":
                    return ["ucsf_Parnassus ACC", "ucsf_LPPI"];
                case "ucsf_Kezar":
                case "ucsf_VAMC":
                    return ["ucsf_E/R"];
                case "ucsf_3360 Geary":
                case "ucsf_Laurel Heights":
                    return ["ucsf_Parnassus Library"];
                case "ucsf_Mt. Zion":
                    return ["ucsf_LPPI", "ucsf_Parnassus Library"];
                default:
                    return ["ucsf_LPPI"];
            }
        },
        "ucsf_MB": function (endpoint) {
            return ["ucsf_MBE","ucsf_MBW"];
        },
        "ucsf_2300 Harrison": function (endpoint) {
            return ["ucsf_2300 Harrison N", "ucsf_2300 Harrison S"];
        },
        "ucsf_100 Buchanan": function (endpoint) {
            return ["ucsf_100 Buchanan N", "ucsf_100 Buchanan S"];
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
            host: "apis.ucsf.edu",
            path: "/opentripplanner-api-webapp/ws/plan?minTransferTime=60&",
            port: 8080,
            headers: {'Content-Type':'application/json'}
        };

        var query = {};
        // Useful parameters the user can send:
        // fromPlace & toPlace are required. 
        // date is required if time is set. default to current time and date.
        // arriveBy defaults to "false"
        query.date = req.query.date;
        query.time = req.query.time;
        query.arriveBy = req.query.arriveBy;

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
                var compareOn = req.query.arriveBy==="true" ? 'endTime' : 'startTime';
                var ascendingSort = req.query.arriveBy==="true" ? -1 : 1;
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
