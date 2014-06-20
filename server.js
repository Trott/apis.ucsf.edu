var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    morgan = require('morgan'),
    compression = require('compression'),
    jsapi = require('./routes/jsapi'),
    person = require('./routes/person'),
    shuttle = require('./routes/shuttle'),
    map = require('./routes/map'),
    fitness = require('./routes/fitness'),
    library = require('./routes/library'),
    nodeUserGid = 'node',
    nodeUserUid = 'node',
    sslKey = '/etc/pki/tls/private/apis_ucsf_edu.key',
    sslCert = '/etc/pki/tls/certs/apis_ucsf_edu_cert.cer';

var setIds = function () {
    'use strict';
    process.setgid(nodeUserGid);
    process.setuid(nodeUserUid);
};

var httpsOptions = {
    key: fs.readFileSync(sslKey),
    cert: fs.readFileSync(sslCert)
};

var app = express();
var logFile;

// See:
//   http://nodejs.org/api/http.html#http_agent_maxsockets 
//   https://twitter.com/substack/status/277226144577761280
http.globalAgent.maxSockets = Number.MAX_VALUE;
https.globalAgent.maxSockets = Number.MAX_VALUE;

logFile = fs.createWriteStream(__dirname + '/logs/http.' + Date.now());

app.use(morgan({stream: logFile}));
app.use(compression());

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

http.createServer(app).listen(80, setIds);
console.log('Serving HTTP on port 80...');
try {
    https.createServer(httpsOptions, app).listen(443, setIds);
    console.log('Serving HTTPS on port 443...');
} catch (e) {
    console.error('Cannot start with SSL: ' + e.message);
}
