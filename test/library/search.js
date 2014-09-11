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
			expect(results.sfx.data.length > 0).to.be.true;
			expect(results.sfx.error).to.be.undefined;
			done();
		});
	});

	it('returns an error if an invalid collection is specified', function (done) {
		searchHelper('medicine', ['fhqwhgads'], function (results) {
			expect(results.fhqwhgads.data).to.be.undefined;
			expect(results.fhqwhgads.error).to.equal('Collection "fhqwhgads" does not exist');
			done();
		})
	});

	it('returns multiple collections if specified', function (done) {
		searchHelper('medicine', ['sfx', 'fhqwhgads'], function (results) {
			expect(results.sfx.data).to.be.ok;
			expect(results.fhqwhgads.error).to.be.ok;
			done();
		});
	});

	it('returns all collections if no collection specified', function (done) {
		searchHelper('medicine', null, function (results) {
			expect(results.sfx.data).to.be.ok;
			done();
		});
	});
});
