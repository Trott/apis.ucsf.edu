var path = require('path');

exports.schedule = function (req, res) {
    'use strict';

    var pathRoot = path.normalize(__dirname + '/../static/');
    var sendfileOptions = {root: pathRoot};
    var schedulePath =  'fitness_schedule.json';
    res.sendfile(schedulePath, sendfileOptions, function (err) {
        if (err && err.status) {
            res.send(err.status);
        }
    });
};