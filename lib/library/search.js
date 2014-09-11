var async = require('async');
var sfx = require('./search/sfx.js');

// var EventEmitter = require('events').EventEmitter;
// var emitter = new EventEmitter();

var collections = {
    sfx: sfx
}

module.exports = function (req, res) {
    'use strict';



    collections[req.query.c].search(req.query.q, function (value) { res.json([{name: 'sfx', data: value.data}]); });

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