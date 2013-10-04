var http = require('http');
var querystring = require('querystring');
// var cheerio = require('cheerio');

exports.lexicomp = function (req, res) {
    'use strict';

    var options = {
        host: 'online.lexi.com',
        headers: {'user-agent': 'curl/7.22.0'},
        path: '/lco/action/search?' + querystring.stringify({q: req.query.q, t:'name'})
    };

    http.get(options, function (resp) {
        if (resp.statusCode > 400) {
            console.log('search/lexicomp status code: ' + resp.statusCode);
            res.send({error: 'Received HTTP status code ' + resp.statusCode});
            return;
        }

        var rawData = '';

        resp.on('data', function (chunk) {
            rawData += chunk;
        });

        resp.on('end', function () {
            res.send('success!\n\n' + rawData);
        });
    }).on('error', function (e) {
        var error = e.message || 'Unknown error';
        console.log('search/lexicomp error: ' + error);
        res.send({error: error});
    });
};