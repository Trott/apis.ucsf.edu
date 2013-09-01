var http = require('http');
var cheerio = require('cheerio');
var articles = {};

exports.articles = function(req, res) {
    'use strict';

    // If the cache is less than 5 minutes old, don't retrieve it again.
    if (articles.timestamp && Date.now() - articles.timestamp < 5 * 60 * 1000) {
        res.send(articles);
        return;
    }

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

                    if (result.nodes instanceof Array) {
                        articles.articles = result.nodes.map(
                            function (el)  {
                                var paragraphs = cheerio.load(el.node.body)('p');
                                el.node.paragraphs = paragraphs.map(function() {
                                    return this.text();
                                });
                                return el.node;
                            }
                        );
                    } else {
                        articles.articles = [];
                    }

                    articles.timestamp = Date.now();
                } catch (e) {
                    articles = {};
                    articles.timestamp = Date.now();
                    console.log('error parsing news JSON: ' + e.message);
                }

                //TODO: use Cheerio or something to parse body and restructure it to something semantic
                res.header("Content-Type", "application/json; charset=utf-8");
                res.send(articles);
            }
        });
    }).on('error', function (e) {
        console.log('news/articles error: ' + e.message);
        res.send({error: e.message});
    });
};