var express = require('express'),
    fs = require('fs'),
    cradle = require('cradle'),
    person = require('./routes/person'),
    nodeUserGid = "node",
    nodeUserUid = "node";

var app = express();
var db = new(cradle.Connection)().database('api_users');

app.use(express.compress());

//TODO NOW: Logging of requests.
//TODO NOW: CORS restrictions should apply to crossdomain.xml too.
//TODO NOW: log rotation
//TODO: Easy install? (Sets up couchdb server with dummy content or something?)
app.use(function (req, res, next) {
    "use strict";

    res.locals.apikeyMatches = false;

    if(req.query.apikey) {
        db.get(req.query.apikey, function (err, doc) {
            if (err) {
                if (err.error === "not_found") {
                    console.log("API key not found: " + req.query.apikey);
                    return res.send(200);
                }
                return next(err);
            }
            if (req.headers.origin && doc.host === req.headers.origin) {
                res.header('Access-Control-Allow-Origin', req.headers.origin);
                res.locals.apikeyMatches = true;

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

app.get(/^\/static\/([\w\/\.]+)$/, function(req,res) {
    "use strict";
    fs.exists(__dirname + '/static/' + req.params[0], function(exists) {
        if (exists) {
            res.sendfile( __dirname + '/static/' + req.params[0]);
            return;
        } else {
            res.send(404);
        }
    });
});

app.get('/person/search', person.search);

// Needed for polyfill for IE7 support :-(
app.get('/crossdomain.xml', function(req,res) {
    "use strict";
    res.send(
        '<?xml version="1.0"?>\n' +
        '<!DOCTYPE cross-domain-policy SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">\n' +
        '<cross-domain-policy>\n' +
        '  <allow-access-from domain="*" />\n' +
        '  <allow-http-request-headers-from domain="*" headers="*" />\n' +
        '</cross-domain-policy>\n'
    );
});

app.listen(80, function() {
  process.setgid(nodeUserGid);
  process.setuid(nodeUserUid);
});

console.log('Listening on port 80...');