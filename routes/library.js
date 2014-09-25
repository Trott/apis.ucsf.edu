var http = require('http'),
    moment = require('moment'),
    amalgamatic = require('amalgamatic'),
    sfx = require('amalgamatic-sfx'),
    millennium = require('amalgamatic-millennium'),
    libguides = require('amalgamatic-libguides'),
    pubmed = require('amalgamatic-pubmed'),
    drupal6 = require('amalgamatic-drupal6');

amalgamatic.add('sfx', sfx);
amalgamatic.add('millennium', millennium);
amalgamatic.add('libguides', libguides);
amalgamatic.add('pubmed', pubmed);
amalgamatic.add('drupal6', drupal6);

// One hour expressed in milliseconds
var oneHour = 1000 * 60 * 60;

var schedule = {};
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
            console.log(errorMsg);
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
                    console.log('error parsing LibGuides JSON: ' + e.message);
                }

                guides = result;
                guides.lastUpdated = Date.now();
            }
        });
    }).on('error', function (e) {
        console.log('updateGuidesAsync error: ' + e.message);
    });
};

var updateScheduleAsync = function () {
    'use strict';

    var options = {
        host: 'api.libcal.com',
        path: '/api_hours_grid.php?iid=138&format=json&weeks=2'
    };

    var data = '';

    http.get(options, function (resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = 'updateScheduleAsync error: code ' + resp.statusCode;
            console.log(errorMsg);
        }
        resp.on('data', function (chunk) {
            data += chunk;
        });
        resp.on('end', function () {

            function extractHours(weeks) {
                var now = moment(),
                    rv = [],
                    day,
                    myDay,
                    date,
                    text;
                for (var i = 0; i < 7; i++) {
                    day = now.format('dddd');
                    date = now.format('YYYY-MM-DD');
                    text = '';
                    for (var j = 0, l = weeks.length; j < l; j++) {
                        if (weeks[j][day] && weeks[j][day].date === date) {
                            myDay = weeks[j][day];
                            if (myDay.times && myDay.times.status === 'closed') {
                                text = 'closed';
                            } else if (myDay.times && myDay.times.hours && myDay.times.hours[0] && myDay.times.hours[0].from && myDay.times.hours[0].to) {
                                text = myDay.times.hours[0].from + ' - ' + myDay.times.hours[0].to;
                            }
                            break;
                        }
                    }
                    rv.push({
                        day: now.format('ddd'),
                        date: now.format('MMM DD'),
                        text: text
                    });
                    now.add(1, 'days');
                }
                return (rv);
            }

            if (resp.statusCode === 200) {
                var result;
                try {
                    result = JSON.parse(data);
                } catch (e) {
                    result = {};
                    console.log('error parsing LibCal JSON: ' + e.message);
                }

                var locations = {};
                if (result.locations && result.locations.length) {
                    for (var i = 0, l = result.locations.length; i < l; i++) {
                        if (result.locations[i].name === 'Parnassus Library') {
                            locations.parnassus = extractHours(result.locations[i].weeks);
                        }
                        if (result.locations[i].name === 'Mission Bay Library') {
                            locations.missionBay = extractHours(result.locations[i].weeks);
                        }
                    }
                }
                schedule.locations = locations;
                schedule.lastUpdated = Date.now();
            }
        });
    }).on('error', function (e) {
        console.log('updateScheduleAsync error: ' + e.message);
    });
};

updateScheduleAsync();
exports.hours = function (req, res) {
    'use strict';

    if (! schedule.lastUpdated || (Date.now() - schedule.lastUpdated > oneHour)) {
        updateScheduleAsync();
    }

    res.json(schedule);
};

updateGuidesAsync();
exports.guides = function (req, res) {
    'use strict';
    if (! guides.guides || (Date.now() - guides.lastUpdated > oneHour)) {
        updateGuidesAsync();
    }

    res.json(guides);
};

exports.search = function (req, res) {
    var callback = null;

    var options = {
        searchTerm: req.query.q
    };

    if (req.query.c && req.query.c instanceof Array) {
        options.collections = req.query.c;
    }

    // async = Server-Sent Events/EventSource
    if (req.query.hasOwnProperty('async')) {

        res.writeHead(200, {
            'Content-Type': 'text/event-stream'
        });
        res.write('\n');

        var sseId = 0;
        options.pluginCallback = function (data) {
            sseId = sseId + 1;

            res.write('id: ' + sseId + '\n');
            res.write('data: ' + JSON.stringify(data) + '\n\n');
        };

    } else {
        callback = function (value) {
            res.json(value);
        };
    }

    amalgamatic.search(options, callback);
};