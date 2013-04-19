var http = require('http'),
    querystring = require('querystring');


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
    "user strict";

    var otpOptions = {
        host: "apis.ucsf.edu",
        path: "/opentripplanner-api-webapp/ws/plan?mode=TRANSIT,WALK&min=QUICK&maxWalkDistance=30&walkSpeed=1.341&",
        port: 8080,
        headers: {'Content-Type':'application/json'}
    };

    var data = '';

    // Useful arameters the user can send:
    // fromPlace & toPlace are required. 
    // date is required if time is set. default to current time and date.
    // arriveBy defaults to "false"
    otpOptions.path += querystring.stringify(req.query);

    http.get(otpOptions, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = "shuttle/plan error: code " + resp.statusCode;
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
        console.log("shuttle/plan error: " + e.message);
        res.send({error: e.message});
    });
};