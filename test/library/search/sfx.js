var sfx = require('../../../lib/library/search/sfx.js');

var nock = require('nock');

var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;
var before = lab.before;

var callback = function(value) {
	emitter.emit('end', value);
};

describe('sfx', function () {

	var sfxHelper = function (q, callback) {
		emitter.once('end', callback);

		sfx.search(q, callback);
	};

	it('returns an empty result if no search term provided', function (done) {
		sfxHelper('', function (result) {
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

	it('returns results if a non-ridiculous search term is provided', function (done) {
		sfxHelper('medicine', function (result) {
			expect(result.data).to.not.be.empty;
			done();
		});
	});

	it('returns an empty result if ridiculous search term is provided', function (done) {
		sfxHelper('fhqwhgads', function (result) {
			expect(result.data).to.be.empty;
			done();
		});
	});

	it('returns a single result for insanely specific search', function (done) {
		sfxHelper('medicine and health, Rhode Island', function (result) {
			expect(result.data.length).to.equal(1);
			done();
		});
	});

	it('returns an error object if there was an HTTP error', function (done) {
		nock.disableNetConnect();
		sfxHelper('medicine', function (result) {
			nock.enableNetConnect();
			expect(result.data).to.be.undefined;
			expect(result.error).to.equal('Nock: Not allow net connect for "ucelinks.cdlib.org:8888"');
			done();
		});
	});
});
