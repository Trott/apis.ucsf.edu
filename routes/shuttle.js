var http = require('http'),
    querystring = require('querystring'),
    async = require('async');

exports.stops = function(req, res) {
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
            res.send({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                var filtered = [],
                    stops = JSON.parse(data);
                if (stops.hasOwnProperty('stops') && stops.stops instanceof Array) {
                    for (var i=0; i<stops.stops.length; i++) {
                        if (stops.stops[i].hasOwnProperty('parentStation') && stops.stops[i].parentStation === null) {
                            filtered.push(stops.stops[i]);
                        }
                    }
                }
                stops.stops = filtered;
                res.send(stops);
            }
        });
    }).on("error", function(e){
        console.log("shuttle/stops error: " + e.message);
        res.send({error: e.message});
    });
};

exports.routes = function(req, res) {
    "use strict";

    var otpOptions = {
        host: "apis.ucsf.edu",
        path: "/opentripplanner-api-webapp/ws/transit/routes?agency=ucsf",
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

    var data = '';

    http.get(otpOptions, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = "shuttle/routes error: code " + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                res.send(data);
            }
        });
    }).on("error", function(e){
        console.log("shuttle/routes error: " + e.message);
        res.send({error: e.message});
    });
};

exports.routesForStop = function(req, res) {
    "use strict";

    var otpOptions = {
        host: "apis.ucsf.edu",
        path: "/opentripplanner-api-webapp/ws/transit/routesForStop?agency=ucsf&",
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

    var data = '';

    // Only useful parameter: id (which is the GTFS stop id)
    otpOptions.path += querystring.stringify(req.query);

    http.get(otpOptions, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = "shuttle/routesForStop error: code " + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                res.send(data);
            }
        });
    }).on("error", function(e){
        console.log("shuttle/routesForStop error: " + e.message);
        res.send({error: e.message});
    });
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
            combined.push([fromPlaces[i],toPlaces[j]]);
        }
    }

    var allResults = [];
    var metadata = {};
    var plan = function (startAndEnd, callback) {
        var otpOptions = {
            host: "apis.ucsf.edu",
            path: "/opentripplanner-api-webapp/ws/plan?mode=TRANSIT,WALK&",
            port: 8080,
            headers: {'Content-Type':'application/json'}
        };

        // Clone req.query
        var query = {};
        for(var keys = Object.keys(req.query), l = keys.length; l; --l) {
            query[ keys[l-1] ] = req.query[ keys[l-1] ];
        }

        query.fromPlace = startAndEnd[0];
        query.toPlace = startAndEnd[1];

        // Useful parameters the user can send:
        // fromPlace & toPlace are required. 
        // date is required if time is set. default to current time and date.
        // arriveBy defaults to "false"
        otpOptions.path += querystring.stringify(query);

        http.get(otpOptions, function(resp) {
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
                        allResults.push.apply(allResults, rv.plan.itineraries);
                    }
                    callback();
                }
            });
        }).on("error", function(e){
            console.log("shuttle/plan error: " + e.message);
            callback({error: e.message});
        });
    };

    async.each(combined, plan, function(err) {
        if (err) {
            res.send(err);
        } else {
            if (metadata.plan) {

                var fromId,
                    itinerary;
                // Remove any "walk to <starting point>" resulting from ugly hack
                for(var l = allResults.length - 1; l>=0; --l) {
                    itinerary = allResults[l];
                    fromId = itinerary.legs[0].to.stopId.agencyId + '_' + itinerary.legs[0].to.stopId.id;
                    if (itinerary.legs[0].mode==="WALK" && fromPlaces.indexOf(fromId)!==-1 ) {
                        allResults.splice(l,1);
                    }
                }

                //TODO: Also remove last steps that are walks from a toPlace to a toPlace.

                // Sort merged results from ugly hack
                var compareOn = req.query.arriveBy==="true" ? 'endTime' : 'startTime';
                var compare = function (a,b) {
                    if (a[compareOn] < b[compareOn]) {
                        return -1;
                    }
                    if (a[compareOn] > b[compareOn]) {
                        return 1;
                    }
                    return 0;
                };
                allResults.sort(compare);
                if (compareOn === "endTime") {
                    allResults.reverse();
                }

                metadata.plan.itineraries = allResults;
            }
            res.send(metadata);
        }
    });
};
