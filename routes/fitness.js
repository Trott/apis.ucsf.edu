var config = require('../config');
var request = require('request');
var csv = require('csv');
var moment = require('moment');

var schedule = {};

var updateScheduleAsync = function () {
    'use strict';
    var date = moment();
    var startDate = date.format('MMDDYYYY');
    date.add('days', 2);
    var endDate = date.format('MMDDYYYY');

    var url = 'http://www.xpiron.com/schedule/Access?pAction=20&pBorgID=2867&pEmailAddr=' +
            config.fitness.username +
            '&pPassword=' +
            config.fitness.password +
            '&pFirstPage=Reports?pAction=60&pType=20002&pStartDate=' +
            startDate +
            '&pEndDate=' +
            endDate +
            '&pServiceID=12552';


    request.get(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
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
                        newData[i - 1].day = moment(newData[i - 1].date).format('dddd');
                    }
                    newData.sort(function (x, y) {
                        var xDate = moment(x.date + ' ' + x.startTime);
                        var yDate = moment(y.date + ' ' + y.startTime);

                        if (xDate < yDate) {
                            return -1;
                        }
                        if (xDate > yDate) {
                            return 1;
                        }
                        return 0;
                    });
                    schedule.classes = newData;
                    schedule.lastUpdated = Date.now();
                });
        } else {
            console.log('fitness/schedule error: ' + JSON.stringify(error));
            if (response && response.statusCode) {
                console.log('HTTP status code: ' + response.statusCode);
            }
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
