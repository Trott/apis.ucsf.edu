var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    morgan = require('morgan'),
    compression = require('compression'),
    config = require('./config'),
    jsapi = require('./routes/jsapi'),
    library = require('./routes/library'),
    person = require('./routes/person'),
    nodeUserGid = process.env.NODEUSERGID || 'node',
    nodeUserUid = process.env.NODEUSERUID || 'node';

var setIds = function () {
    'use strict';
    process.setgid(nodeUserGid);
    process.setuid(nodeUserUid);
};

var httpsOptions = {};
if (config.ssl) {
    try {
        httpsOptions = {
            key: fs.readFileSync(config.ssl.key),
            cert: fs.readFileSync(config.ssl.cert),
        };
        if (config.ssl.ca) {
            httpsOptions.ca = config.ssl.ca.map(function(certFile) { return fs.readFileSync(certFile);});
        }

    } catch (e) {
        console.warn('Error setting HTTPS options: ' + e.message);
    }
}

var app = express();
var logFile;

logFile = fs.createWriteStream(__dirname + '/logs/http.' + Date.now());

app.use(morgan('combined', {stream: logFile}));
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
        res.sendStatus(200);
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

app.get('/library/hours', library.hours);
app.get('/library/guides', library.guides);
app.get('/library/search', library.search);

app.get('/person/search', person.search);

// Redirect shuttle request to clsm server
app.get('/shuttle/:route', function (req, res) {
    res.redirect('http://clsm.ucsf.edu:8000' + req.url);
});

app.get('/', function (req, res) {
    'use strict';
    res.sendFile(__dirname + '/static/index.html');
});

http.createServer(app).listen(80, setIds);
console.log('Serving HTTP on port 80...');

try {
    https.createServer(httpsOptions, app).listen(443, setIds);
    console.log('Serving HTTPS on port 443...');
} catch (e) {
    console.error('Cannot start with SSL: ' + e.message);
}
