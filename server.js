var express = require('express'),
    fs = require('fs'),
    cradle = require('cradle'),
    person = require('./routes/person'),
    shuttle = require('./routes/shuttle'),
    nodeUserGid = "node",
    nodeUserUid = "node";

var app = express();
var db = new(cradle.Connection)().database('api_users');

app.use(express.logger());
app.use(express.compress());

//TODO: log rotation
//TODO: Better log file than, uh, server.js.log?
//TODO: Easy install? (Sets up couchdb server with dummy content or something?)
//TODO: Dependency: OpenTripPlanner

app.use('/static', express.static(__dirname + '/static'));

// If we're serving dynamic content, instruct browser to not cache.
// Not really needed except to work around Android 2.3 bug.
app.use(function (req, res, next) {
    res.header('Cache-Control', 'no-cache');
    next();
});

app.use(function (req, res, next) {
    "use strict";

    if(req.query.apikey) {
        db.get(req.query.apikey, function (err, doc) {
            if (err) {
                if (err.error === "not_found") {
                    console.log("API key not found: " + req.query.apikey);
                    return res.send(200);
                }
                return next(err);
            }
            if (doc.host === "*" || (req.headers.origin && doc.host === req.headers.origin)) {
                res.header('Access-Control-Allow-Origin', req.headers.origin);

                if(req.headers['access-control-request-method']) {
                    res.header('Access-Control-Allow-Methods', "GET, OPTIONS");
                }

                res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
            }

            if (req.method === 'OPTIONS') {
                res.send(200);
            } else  {
                next();
            }
        });
    } else {
        next();
    }
});

app.use(function(err, req, res, next){
  console.dir(err);
  res.send(500, 'Server error');
});

app.get('/person/search', person.search);

app.get('/shuttle/plan', shuttle.plan);
app.get('/shuttle/routes', shuttle.routes);
app.get('/shuttle/stops', shuttle.stops);
app.get('/shuttle/times', shuttle.times);


// Needed for polyfill for IE7 support :-(
app.get('/crossdomain.xml', function(req,res) {
    "use strict";
    // Yup, IE7 polyfill will allow any origin.
    res.send(
        '<?xml version="1.0"?>\n' +
        '<!DOCTYPE cross-domain-policy SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">\n' +
        '<cross-domain-policy>\n' +
        '  <allow-access-from domain="*" />\n' +
        '  <allow-http-request-headers-from domain="*" headers="*" />\n' +
        '</cross-domain-policy>\n'
    );
});

app.get('/', function(req,res) {
    "use strict";
    res.sendfile( __dirname + '/static/index.html');
});

app.listen(80, function() {
  process.setgid(nodeUserGid);
  process.setuid(nodeUserUid);
});

console.log('Listening on port 80...');