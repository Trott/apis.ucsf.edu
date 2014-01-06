var http = require('http');
var cheerio = require('cheerio');
var news = {};

exports.articles = function(req, res) {
    'use strict';

    // If the cache is less than 5 minutes old, don't retrieve it again.
    if (news.timestamp && Date.now() - news.timestamp < 5 * 60 * 1000) {
        res.send(news);
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
            var articles = [];
            var result;

            if (resp.statusCode === 200) {
                try {
                    result = JSON.parse(data);

                    if (result.nodes instanceof Array) {
                        // Post-Process Nonsense (PPN) for each node
                        articles = result.nodes.map(
                            function (el)  {
                                // PPN: Split body (blob of HTML) into paragraphs.
                                var paragraphs = cheerio.load(el.node.body)('p');

                                // PPN: Only include text, not arbitrary HTML.
                                paragraphs = paragraphs.map(function() {
                                    return this.text();
                                });

                                // PPN: Do not include empty paragraphs.
                                paragraphs = paragraphs.filter(function (value) {
                                    return value !== '';
                                });

                                el.node.paragraphs = paragraphs;
                                delete el.node.body;
                                return el.node;
                            }
                        );
                    }

                    news.articles = articles;

                    news.timestamp = Date.now();
                } catch (e) {
                    news = {};
                    news.timestamp = Date.now();
                    console.log('error parsing news JSON: ' + e.message);
                }

                res.header("Content-Type", "application/json; charset=utf-8");
                res.send(news);
            }
        });
    }).on('error', function (e) {
        console.log('news/articles error: ' + e.message);
        res.send({error: e.message});
    });
};