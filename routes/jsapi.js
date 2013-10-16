var http = require('http'),
    querystring = require('querystring'),
    async = require('async'),
    fs = require('fs');

var validFileNameRegExp = /^[a-z_]+$/;
exports.load = function(req, res) {
    "use strict";

    var files = [];
    // PhoneGap + Android 4.2.2 + Galaxy S4 + our CORS implementation = crash without Zepto's XHR.
    // TODO: Should eventually fix by eliminating our CORS implementation and letting people roll their own.
    // They'll just use jQuery or Zepto typically anyway.
    if (req.headers['user-agent'].search(/Android 4\.2/) !== -1) {
        files.push('zepto-1.0');
    }
    files.push('base');
    var lib;
    for (lib in req.query) {
        if (validFileNameRegExp.test(lib)) {
            files.push(lib);
        }
    }

    var rv='';
    async.eachSeries(
        files,
        function(item, callback) {
            fs.readFile(__dirname + '/../js_fragments/' + item, function(err, content) {
                if (!err) {
                    rv += content;
                }
                callback(err);
            });
        },
        function(err) {
            if (!err) {
                res.contentType('js');
                res.send(200, rv);
            } else {
                console.log(err);
                res.send(404);
            }
        }
    );
};