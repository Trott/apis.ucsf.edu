'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var moment = require('moment');

var schedule = {};

function LibrarySchedule() {
    EventEmitter.call(this);
}
util.inherits(LibrarySchedule, EventEmitter);

LibrarySchedule.prototype.update = function (options) {
    var self = this;
    options = options || {};
    var logger = options.logger || util.log;

    var httpOptions = {
        host: 'api.libcal.com',
        path: '/api_hours_grid.php?iid=138&format=json&weeks=2'
    };

    var data = '';

    http.get(httpOptions, function (resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = 'updateScheduleAsync error: code ' + resp.statusCode;
            logger(errorMsg);
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

                var retrieveTextCallback = function (value) {
                    myDay = value[day];
                    if (myDay.date === date) {
                        if (myDay.times && myDay.times.status === '24hours') {
                            text = '24 hours';
                        } else if (myDay.times && myDay.times.status === 'closed') {
                            text = 'closed';
                        } else if (myDay.times && myDay.times.hours && myDay.times.hours[0] && myDay.times.hours[0].from && myDay.times.hours[0].to) {
                            text = myDay.times.hours[0].from + ' - ' + myDay.times.hours[0].to;
                        }
                    }
                };
                
                for (var i = 0; i < 7; i++) {
                    day = now.format('dddd');
                    date = now.format('YYYY-MM-DD');
                    text = '';
                    weeks.forEach(retrieveTextCallback);
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
                    logger('error parsing LibCal JSON: ' + e.message);
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
                        if (result.locations[i].name === 'Mission Bay Hub') {
                            locations.missionBayHub = extractHours(result.locations[i].weeks);
                        }
                    }
                }
                schedule.locations = locations;
                schedule.lastUpdated = Date.now();
                self.emit('update');
            }
        });
    }).on('error', function (e) {
        logger('updateScheduleAsync error: ' + e.message);
    });
};

LibrarySchedule.prototype.get = function () {
    return {locations: schedule.locations, lastUpdated: schedule.lastUpdated};
};

module.exports = exports = new LibrarySchedule();
