'use strict';

var request = require('request');
var parser = require('xml2js');

exports.fetch = function (callback) {
	request('https://blogs.library.ucsf.edu/newstest/feed/', function (error, response, body) {
  		if (!error && response.statusCode === 200) {
  			parser.parseString(body, callback);
  			return;
  		}
  		if (error) {
  			callback(error);
  			return;
  		}
  		callback(new Error('received status code ' + response.statusCode));
  	});
};