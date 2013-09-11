var express = require('express'),
    jsapi = require('./routes/jsapi'),
    person = require('./routes/person'),
    shuttle = require('./routes/shuttle'),
    map = require('./routes/map'),
    freeFood = require('./routes/free_food'),
    fitness = require('./routes/fitness'),
    library = require('./routes/library'),
    nodeUserGid = 'node',
    nodeUserUid = 'node';

var app = express();

app.use(express.logger());
app.use(express.compress());

//TODO: log rotation
//TODO: Better log file than, uh, server.js.log?
//TODO: Dependency: OpenTripPlanner
//TODO: modularize stuff like OpenTripPlanner and the map tile server so they can
//      be deployed on other servers or something

app.use('/static', express.static(__dirname + '/static'));

// Instruct Android 2.x browser to not cache CORS results because it will return 0/empty from cache.
// We want to limit this damage to Android 2.x because caching requests for a short period of time
//    is a good idea. But, uh, only if the caching implementation works. Definitely broken in Android 2.3
var android2RegExp = / Android 2\./;
app.use(function (req, res, next) {
    'use strict';
    if (android2RegExp.test(req.headers['user-agent'])) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Expires', '0');
    }
    next();
});

app.use(function (req, res, next) {
    'use strict';

    res.header('Access-Control-Allow-Origin', '*');

    if (req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    }
    if (req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    }

    res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);

    if (req.method === 'OPTIONS') {
        res.send(200);
    } else  {
        next();
    }
});

app.use(function (err, req, res, undefined) {
    'use strict';
    console.dir(err);
    res.send(500, 'Server error');
});

app.get('/jsapi', jsapi.load);

app.get('/person/search', person.search);

app.get('/shuttle/plan', shuttle.plan);
app.get('/shuttle/routes', shuttle.routes);
app.get('/shuttle/stops', shuttle.stops);
app.get('/shuttle/times', shuttle.times);
app.get('/shuttle/predictions', shuttle.predictions);

app.get('/map/tile/:zoom/:x/:y', map.tile);

app.get('/free_food/events', freeFood.events);

app.get('/fitness/schedule', fitness.schedule);

app.get('/library/hours', library.hours);

// Needed for polyfill for IE7 support :-(
app.get('/crossdomain.xml', function (req, res) {
    'use strict';
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

app.get('/', function (req, res) {
    'use strict';
    res.sendfile(__dirname + '/static/index.html');
});

app.listen(80, function () {
    'use strict';
    process.setgid(nodeUserGid);
    process.setuid(nodeUserUid);
});

console.log('Listening on port 80...');