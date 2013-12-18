var http = require('http');
var querystring = require('querystring');
var cheerio = require('cheerio');

exports.lexicomp = function (req, res) {
    'use strict';

    var host = 'online.lexi.com';
    var rv = {};

    var options = {
        host: host,
        headers: {'user-agent': 'curl/7.22.0'},
        path: '/lco/action/search?' + querystring.stringify({q: req.query.q, t:'name'})
    };

    http.get(options, function (resp) {
        res.setHeader('Content-Type', 'application/json');

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
            var $ = cheerio.load(rawData);
            rv.searchResults = [];
            $('#main .search-result').each(function(i, elem) {
                var result = {};
                result.database = $(elem).find('h1').text();
                result.results = [];
                $(elem).find('.result-list li a').each(function(i, elem) {
                    var text = $(elem).text();
                    var url = 'http://' + host + $(elem).attr('href');
                    result.results.push({text: text, url: url});
                });

                rv.searchResults.push(result);
            });
            res.send(rv);
        });
    }).on('error', function (e) {
        var error = e.message || 'Unknown error';
        console.log('search/lexicomp error: ' + error);
        res.send({error: error});
    });
};