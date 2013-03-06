var express = require('express'),
    fs = require('fs'),
    person = require('./routes/person');

var app = express();

//TODO: this allows all hosts. We should specify based on API key.
app.use(function(req, res, next) {
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
    if (oneof && req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

//TODO: Move this to its own package
app.get('/static/:file', function(req,res) {
    if (fs.existsSync(__dirname + '/static/' + req.params.file)) {
        res.sendfile( __dirname + '/static/' + req.params.file);
        return;
    }
    res.send(404);
});

app.get('/person/search', person.search);

app.listen(80);
console.log('Listening on port 80...');