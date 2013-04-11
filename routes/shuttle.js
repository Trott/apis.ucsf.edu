var http = require('http');

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
            var errorMsg = "Shuttle error: code " + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
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
        });
    }).on("error", function(e){
        console.log("Shuttle error: " + e.message);
        res.send({error: e.message});
    });
};