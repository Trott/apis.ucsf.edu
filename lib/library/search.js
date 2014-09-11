var async = require('async');
var sfx = require('./search/sfx.js');

var collections = {
    sfx: sfx
}

module.exports = function (req, res) {
    'use strict';

    var requestedCollections;
    if (! req.query.c || ! req.query.c instanceof Array) {
        requestedCollections = Object.keys(collections);
    } else {
        requestedCollections = req.query.c;
    }

    var results = {};

    var iterator = function (c, done) {
        if (c in collections) {
            collections[c].search(req.query.q, function (value) {
                results[c] = {data: value.data};
                done();
            });
        } else {
            results[c] = {error: 'Collection does not exist'};
            done();
        }
    };

    var callback = function (err) {
        res.json(results);
    }

    async.each(requestedCollections, iterator, callback);

    // If no collections specified, serach all of them
    // if (! req.query.c) {

    // }

    // var keys = Object.keys(collections);

    // var iterator = function (key) {
    //     collections[key].search(req.query.q, res);
    // }

    // var callback = function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     return 
    // }

    // async.each(keys, iterator, callback);
};