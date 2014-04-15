var express = require('express'),
    fs = require('fs'),
    jsapi = require('./routes/jsapi'),
    person = require('./routes/person'),
    shuttle = require('./routes/shuttle'),
    map = require('./routes/map'),
    fitness = require('./routes/fitness'),
    library = require('./routes/library'),
    nodeUserGid = 'node',
    nodeUserUid = 'node';

var app = express();
var logFile;

logFile = fs.createWriteStream(__dirname + '/logs/http.' + Date.now());

app.use(express.logger({stream: logFile}));
app.use(express.compress());

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

app.get('/fitness/schedule', fitness.schedule);

app.get('/library/hours', library.hours);
app.get('/library/guides', library.guides);

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