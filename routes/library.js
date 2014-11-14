var http = require('http'),
    schedule = require('../utils/librarySchedule.js');

var amalgamatic = require('amalgamatic'),
    sfx = require('amalgamatic-sfx'),
    millennium = require('amalgamatic-millennium'),
    libguides = require('amalgamatic-libguides'),
    pubmed = require('amalgamatic-pubmed'),
    drupal6 = require('amalgamatic-drupal6'),
    dbs = require('amalgamatic-ucsflibdbs');

libguides.setOptions({urlParameters: {content_type: ['books','google', 'rss', 'docs', 'database', 'links']}});

amalgamatic.add('sfx', sfx);
amalgamatic.add('millennium', millennium);
amalgamatic.add('libguides', libguides);
amalgamatic.add('pubmed', pubmed);
amalgamatic.add('drupal6', drupal6);
amalgamatic.add('dbs', dbs);

var logger = console.log;

// One hour expressed in milliseconds
var oneHour = 1000 * 60 * 60;

var guides = {};

var updateGuidesAsync = function () {
    'use strict';

    var options = {
        host: 'lgapi.libapps.com',
        path: '/1.0/guides/100978,100985,100999,100992,100980,100974,100998,100991,100979,100984,100994,13690,100988,101010,100986,101021,100983,100966,100975,100967,101006,100971,101002,100996?site_id=407'
    };

    var data = '';

    http.get(options, function (resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = 'updateGuidesAsync error: code ' + resp.statusCode;
            logger(errorMsg);
        }
        resp.on('data', function (chunk) {
            data += chunk;
        });
        resp.on('end', function () {
            if (resp.statusCode === 200) {
                var result = {};
                try {
                    var featured = JSON.parse(data);
                    result.guides = featured.map(function (val) {
                        var title = val.name;
                        var href = 'http://guides.ucsf.edu/c.php?g=' + parseInt(val.id,10);
                        var desc = val.description;
                        return {title: title, href: href, desc: desc};
                    });
                } catch (e) {
                    result = {};
                    logger('error parsing LibGuides JSON: ' + e.message);
                }

                guides = result;
                guides.lastUpdated = Date.now();
            }
        });
    }).on('error', function (e) {
        logger('updateGuidesAsync error: ' + e.message);
    });
};

schedule.update({logger: logger});
exports.hours = function (req, res) {
    'use strict';

    var mySchedule = schedule.get();

    if (! mySchedule.lastUpdated || (Date.now() - mySchedule.lastUpdated > oneHour)) {
        schedule.update({logger: logger});
    }

    res.json(mySchedule);
};

updateGuidesAsync();
exports.guides = function (req, res) {
    'use strict';
    
    if (! guides.guides || (Date.now() - guides.lastUpdated > oneHour)) {
        updateGuidesAsync();
    }

    res.json(guides);
};

// RegExp for URLs that don't need a proxy prefix
var proxyifyRegExp = /^https?:\/\/([a-z\.]*ucsf.edu|ucsf.idm.oclc.org|ucelinks.cdlib.org)[:\/]/i;
var proxify = function (url) {
    if ((typeof url === 'string') && (! proxyifyRegExp.test(url))) {
        url = 'https://ucsf.idm.oclc.org/login?qurl=' + encodeURIComponent(url);
    }
    return url;
};
var proxifyCollection = function (values) {
    values.url = proxify(values.url);
    values.data.forEach(function(datum) {
        datum.url = proxify(datum.url);
    });
};

exports.search = function (req, res) {
    var callback;

    var options = {
        searchTerm: req.query.q,
        maxResults: 5
    };

    if (req.query.c && req.query.c instanceof Array) {
        options.collections = req.query.c;
    }

    // async = Server-Sent Events/EventSource
    if (req.query.hasOwnProperty('async')) {

        res.writeHead(200, {
            'Content-Type': 'text/event-stream'
        });

        options.pluginCallback = function (err, data) {
            proxifyCollection(data);
            res.write('data: ' + JSON.stringify(data) + '\n\n');
            res.flush();
        };

        callback = function () {
            res.write('event: end\n');
            res.write('data\n\n');
            res.flush();
            res.end();
        };

    } else {
        callback = function (err, values) {
            if (err) {
                var msg = err.message || 'unknown error';
                logger('library/search error: ' + msg);
            } else {
                values.forEach(function (value) {
                    proxifyCollection(value);
                });
                res.json(values);
            }
        };
    }

    amalgamatic.search(options, callback);
};