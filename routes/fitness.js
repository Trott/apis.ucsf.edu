var config = require('../config');
var request = require('request');
var csv = require('csv');
var moment = require('moment');
var async = require('async');

var schedule = {};

var authenticate = function (callback) {
    'use strict';

    var authOptions = {
        url: 'http://www.xpiron.com/schedule/Access',
        jar: true,
        qs: {
            pAction: '20',
            pBorgID: '2867',
            pEmailAddr: config.fitness.username,
            pPassword: config.fitness.password
        }
    };
    request.get(authOptions, function(error, response) {
        if (error) {
            callback(error);
            return;
        }

        if (response.statusCode !== 200) {
            callback(response);
            return;
        }

        callback();
    });
};

var updateSchedule = function (callback) {
    'use strict';

    var date = moment();
    var startDate = date.format('MMDDYYYY');
    date.add(2, 'days');
    var endDate = date.format('MMDDYYYY');

    var schedOptions = {
        url: 'http://www.xpiron.com/schedule/Reports',
        jar: true,
        qs: {
            pAction: '60',
            pType: '20002',
            pStartDate: startDate,
            pEndDate: endDate,
            pServiceID: '12552'
        }
    };

    request.get(schedOptions, function(error, response, body) {
        if (error) {
            callback(error);
            return;
        }

        if (response.statusCode !== 200) {
            callback(response);
            return;
        }

        var rv = {};
        csv()
        .from(body)
        .to.array(function (data, count) {
            var allHeaders = data[0];
            var headers = {};
            headers[allHeaders.indexOf('GroupEvent')] = 'name';
            headers[allHeaders.indexOf('Date')] = 'date';
            headers[allHeaders.indexOf('Start Time')] = 'startTime';
            headers[allHeaders.indexOf('End Time')] = 'endTime';
            headers[allHeaders.indexOf('Instructor First Name')] = 'instructorFirstName';
            headers[allHeaders.indexOf('Instructor Last Name')] = 'instructorLastName';
            headers[allHeaders.indexOf('Location')] = 'location';

            var newData = [];
            for (var i = 1; i < count; i++) {
                newData[i - 1] = {};
                for (var prop in headers) {
                    newData[i - 1][headers[prop]] = data[i][prop];
                }
                newData[i - 1].day = moment(newData[i - 1].date, 'MM/DD/YYYY').format('dddd');
            }
            newData.sort(function (x, y) {
                var xDate = moment(x.date + ' ' + x.startTime, 'MM/DD/YYYY hh:mm a');
                var yDate = moment(y.date + ' ' + y.startTime, 'MM/DD/YYYY hh:mm a');

                if (xDate < yDate) {
                    return -1;
                }
                if (xDate > yDate) {
                    return 1;
                }
                return 0;
            });
            rv.classes = newData;
            rv.lastUpdated = Date.now();
            callback(null, rv);
        });
    });
};


var updateScheduleAsync = function () {
    'use strict';

    async.series([authenticate, updateSchedule], function (err, result) {
        if (err) {
            if (err.statusCode) {
                console.log('fitness/schedule error: received HTTP status code ' + err.statusCode);
            } else {
                console.log('fitness/schedule error: ' + JSON.stringify(err));
            }
        } else {
            schedule = result[result.length-1];
        }
    });
};

updateScheduleAsync();

exports.schedule = function (req, res) {
    'use strict';

    if (typeof schedule === 'undefined' || ! schedule.lastUpdated) {
        schedule = {};
        updateScheduleAsync();
    } else if (Date.now() - schedule.lastUpdated > 1000 * 60 * 60) {
        // schedule is older than an hour, refresh it
        updateScheduleAsync();
    }

    res.json(schedule);
};
