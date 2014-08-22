var https = require('https'),
    querystring = require('querystring');

exports.search = function (req, res) {
    'use strict';

    if (! req.query.q) {
        res.send({data: []});
        return;
    }
    var options = {
        host: 'directory.ucsf.edu',
        port: 443,
        path: '/?json&' + querystring.stringify({q: req.query.q}),
    };

    https.get(options, function (resp) {
        var rawData = '';

        resp.on('data', function (chunk) {
            rawData += chunk;
        });

        resp.on('end', function () {
            // Change a few arrays to objects. There can only be one display name or primary department.
            var cookedData = JSON.parse(rawData);

            var convertToString = function (input) {
                if (input instanceof Array) {
                    return input[0];
                }
                return input;
            };

            if (cookedData.data && cookedData.data instanceof Array) {
                for (var i = 0, l = cookedData.data.length; i < l; i++) {
                    cookedData.data[i].displayname = convertToString(cookedData.data[i].displayname);
                    cookedData.data[i].ucsfeduprimarydepartmentname = convertToString(cookedData.data[i].ucsfeduprimarydepartmentname);
                }
            }

            res.json(cookedData);
        });
    }).on('error', function (e) {
        console.log('Directory error: ' + e.message);
        res.json({error: e.message});
    });
};