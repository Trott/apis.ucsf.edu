var http = require('http');
var url = require('url');
var config = require('../config');
var request = require('request');
var csv = require('csv');

var schedule = {};

var formatDate = function (date) {
    var pad = function (n){return n<10 ? '0'+n : n;};
    return pad(date.getMonth()+1) +
        pad(date.getDate()) +
        pad(date.getFullYear());
};

var callbackHeck = function (callbackOptions) {

};

var updateScheduleAsync = function () {
    var date = new Date();
    var startDate = formatDate(date);
    date.setDate(date.getDate() + 2);
    var endDate = formatDate(date);

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
        if (!error && response.statusCode == 200) {
            var data = csv()
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
                    for (var i=1; i<count; i++) {
                        newData[i-1] = {};
                        for (var prop in headers) {
                            newData[i-1][headers[prop]] = data[i][prop];
                        }
                    }
                    schedule.classes = newData;
                    schedule.lastUpdated = Date.now();
                });
        } else {
            console.log('fitness/schedule error: ' + JSON.stringify(error));
            console.log('HTTP status code: ' + response.statusCode);
        }
    });
    //TODO: convert result to JSON
};

updateScheduleAsync();

exports.schedule = function (req, res) {
    'use strict';

    if (typeof schedule === "undefined" || ! schedule.lastUpdated) {
        schedule = {};
        updateScheduleAsync();
    } else if (Date.now() - schedule.lastUpdated > 1000 * 60 * 60) {
        // schedule is older than an hour, refresh it
        updateScheduleAsync();
    }

    res.send(schedule);
};