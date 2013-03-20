var express = require('express'),
    fs = require('fs'),
    person = require('./routes/person'),
    nodeUserGid = "node",
    nodeUserUid = "node",
    apikeyMatches = false;

var app = express();

app.use(express.compress());

//TODO: Logging of requests.
//TODO: CORS restrictions should apply to crossdomain.xml too.
//TODO: log rotation
app.use(function (req, res, next) {
    "use strict";

    var apikeyMatches = false;
    if(req.headers.origin && req.query.apikey) {
        //TODO: look up host in couchdb and only send the A-OK if it matches the origin header
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        apikeyMatches = true;

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

app.get(/^\/static\/([\w\/\.]+)$/, function(req,res) {
    "use strict";
    if (fs.existsSync(__dirname + '/static/' + req.params[0])) {
        res.sendfile( __dirname + '/static/' + req.params[0]);
        return;
    }
    res.send(404);
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