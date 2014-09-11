var search = require('../../lib/library/search.js');

var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;
var before = lab.before;

var res = {
	json: function(value) {
		emitter.emit('end', value);
	}
};

describe('search', function () {

	var searchHelper = function (q, c, callback) {
		var req = {
			query: {
				q: q,
				c: c
			}
		};

		emitter.once('end', callback);

		search(req, res);
	};

	it('returns only specified collection', function (done) {
		searchHelper('medicine', ['sfx'], function (results) {
			expect(results.length).to.equal(1);
			expect(results[0].name).to.equal('sfx');
			done();
		});
	});
});
