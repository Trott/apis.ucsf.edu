var express = require('express'),
    fs = require('fs'),
    person = require('./routes/person');

var app = express();


//TODO: this allows all hosts. We should specify based on API key.
//TODO: Same as above but for crossdomain.xml too.
//TODO: Make robust with supervisor and also domains to catch errors.
//TODO: HTTP compression a la mod_deflate
app.use(function (req, res, next) {
    "use strict";
    var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }
    if(oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    // intercept OPTIONS method
    if (oneof && req.method === 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

app.get(/^\/static\/([\w\/\.]+)$/, function(req,res) {
    "use strict";
    console.log('hit');
    console.log(req.params[0]);
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

app.listen(80);
console.log('Listening on port 80...');