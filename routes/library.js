var http = require('http'),
    moment = require('moment'),
    cheerio = require('cheerio');

// One hour expressed in milliseconds
var oneHour = 1000 * 60 * 60;

var schedule = {};
var guides = {};

var updateGuidesAsync = function () {
    'use strict';

    var options = {
        host: 'api.libguides.com',
        path: '/api_search.php?iid=1584&type=tags&search=featured&more=false&desc=on'
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
                var result;
                try {
                    // remove br tags
                    var cleaned = data.replace(/<br ?\/?>/ig, '');
                    // split along newline
                    var featured = cleaned.split('\n');
                    // remove empty lines
                    featured = featured.filter(function (val) { return !!val;});
                    // Parse each line so we can return JSON values
                    result = featured.map(function (val) {
                        var $ = cheerio.load('<div>' + val + '</div>');
                        var title = $('a').text();
                        var href = $('a').attr('href');
                        var desc = $('div').text().substr(title.length).replace(/^[ \-]*/, '');
                        return {title: title, href: href, desc: desc};
                    });
                    console.dir(result);

                } catch (e) {
                    result = {};
                    console.log('error parsing LibGuides JSON: ' + e.message);
                }

                guides.data = data;
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
                    now.add('days', 1);
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

    res.send(schedule);
};

updateGuidesAsync();
exports.guides = function (req, res) {
    'use strict';
    if (! guides.featured || (Date.now() - guides.lastUpdated > oneHour)) {
        updateGuidesAsync();
    }

    res.send(guides);
};