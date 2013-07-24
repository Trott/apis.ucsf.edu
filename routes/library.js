var http = require('http');

exports.hours = function (req, res) {
    'use strict';

    var options = {
        host: 'api.libcal.com',
        path: '/api_hours_grid.php?iid=138&format=json&weeks=2'
    };

    var data = '';

    http.get(options, function (resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = 'library/hours error: code ' + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
        }
        resp.on('data', function (chunk) {
            data += chunk;
        });
        resp.on('end', function () {
            if (resp.statusCode === 200) {
                var result;
                try {
                    result = JSON.parse(data);
                } catch (e) {
                    result = {};
                    console.log('error parsing LibCal JSON: ' + e.message);
                }

                /* 
                    LibCal results include a "desc" field for each location with embedded HTML with
                    inline styling. No no no no no no no no no! Returning just the name and hours.
                */
                var locations = [];
                if (result.locations && result.locations.length) {
                    for (var i = 0, l = result.locations.length; i < l; i++) {
                        locations[i] = {};
                        locations[i].name = result.locations[i].name;
                        locations[i].weeks = result.locations[i].weeks;
                    }
                }
                res.send({locations: locations});
            }
        });
    }).on('error', function (e) {
        console.log('library/hours error: ' + e.message);
        res.send({error: e.message});
    });
};