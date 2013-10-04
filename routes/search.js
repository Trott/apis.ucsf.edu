var http = require('http');
var querystring = require('querystring');
// var cheerio = require('cheerio');

exports.lexicomp = function (req, res) {
    'use strict';

    var options = {
        host: 'online.lexi.com',
        port: 80,
        path: '/lco/action/search?t=name&' + querystring.stringify({q: req.query.q})
    };

    console.log(options.path);

    http.get(options, function (resp) {
        if (resp.statusCode > 400) {
            console.log('search/lexicomp status code: ' + resp.statusCode);
            res.send({error: 'Received HTTP status code ' + resp.statusCode});
            return;
        }

        var rawData = '';

        resp.on('data', function (chunk) {
            console.log("BODY: " + chunk);
            rawData += chunk;
        });

        resp.on('end', function () {
            console.log('here we go');
            res.send(rawData);
        });
    }).on('error', function (e) {
        var error = e.message || 'Unknown error';
        console.log('search/lexicomp error: ' + error);
        res.send({error: error});
    });
};