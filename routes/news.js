var http = require('http');
var articles = {};

exports.articles = function(req, res) {
    'use strict';

    var options = {
        host: 'www.ucsf.edu',
        path: '/news/carousel/json',
    };

    var data = '';

    http.get(options, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = "news/articles error: code " + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                var result;

                try {
                    result = JSON.parse(data);
                    articles.articles = result.nodes || [];
                    articles.timestamp = Date.now();
                } catch (e) {
                    articles = {};
                    articles.timestamp = Date.now();
                    console.log('error parsing news JSON: ' + e.message);
                }

                //TODO: add timestamp and cache
                //TODO: use Cheerio or something to parse body and restructure it to something semantic
                res.send(articles);
            }
        });
    }).on('error', function (e) {
        console.log('news/articles error: ' + e.message);
        res.send({error: e.message});
    });
};