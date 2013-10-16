var http = require('http'),
    querystring = require('querystring'),
    async = require('async'),
    fs = require('fs');

var validFileNameRegExp = /^[a-z_]+$/;
exports.load = function(req, res) {
    "use strict";

    var files = ['zepto-1.0', 'base'];
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