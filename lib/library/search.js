var querystring = require('querystring');
var cheerio = require('cheerio');
var http = require('http');

module.exports = function (req, res) {
    'use strict';

    if (! req.query.q) {
        res.json({data: []});
        return;
    }

    var options = {
        host: 'ucelinks.cdlib.org',
        port: 8888,
        path: '/sfx_ucsf/az?param_textSearchType_value=startsWith&' + 
            querystring.stringify({param_pattern_value: req.query.q}),
    };

    http.get(options, function (resp) {
        var rawData = '';

        resp.on('data', function (chunk) {
            rawData += chunk;
        });

        resp.on('end', function () {
            var $ = cheerio.load(rawData);
            var result = [];
            $('a.Results').each(function () {
                result.push({
                    'name': $(this).text(),
                    'url': $(this).attr('href')
                });
            });

            res.json({data: result});
        });
    }).on('error', function (e) {
        console.log('Search error: ' + e.message);
        res.json({error: e.message});
    });
};