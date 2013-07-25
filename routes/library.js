var http = require('http'),
    moment = require('moment');

exports.hours = function (req, res) {
    'use strict';

    var options = {
        host: 'api.libcal.com',
        path: '/api_hours_grid.php?iid=138&format=json&weeks=2'
    };

    var data = '';

    http.get(options, function (resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = 'library/hours error: code ' + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
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
                        day: day,
                        date: date,
                        text: text
                    });
                    now.add('days', 1);
                }
                return (rv);
                // var rv = weeks.filter(function (item) {
                //     return item[today].date === startDate;
                // });
                // return [rv[0].Sunday, rv[0].Monday];
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
                res.send({locations: locations});
            }
        });
    }).on('error', function (e) {
        console.log('library/hours error: ' + e.message);
        res.send({error: e.message});
    });
};