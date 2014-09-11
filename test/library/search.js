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

	var searchHelper = function (q, callback) {
		var req = {
			query: {
				q: q
			}
		};

		emitter.once('end', callback);

		search(req, res);
	};

	it('returns an empty result if no search term provided', function (done) {
		searchHelper('', function (result) {
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

	it('returns results if a non-ridiculous search term is provided', function (done) {
		searchHelper('medicine', function (result) {
			expect(result.data).to.not.be.empty;
			done();
		});
	});

	it('returns an empty result if ridiculous search term is provided', function (done) {
		searchHelper('fhqwhgads', function (result) {
			expect(result.data).to.be.empty;
			done();
		})
	});

	it('returns a single result for insanely specific search', function (done) {
		searchHelper('medicine and health, Rhode Island', function (result) {
			expect(result.data.length).to.equal(1);
			done();
		})
	})
});
