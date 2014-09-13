/*jshint expr: true*/

var millennium = require('../../../lib/library/search/millennium.js');

// var nock = require('nock');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;

describe('millennium', function () {

	it('returns an empty result if no search term provided', function (done) {
		millennium.search('', function (result) {
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

// 	it('returns results if a non-ridiculous search term is provided', function (done) {
// 		millennium.search('medicine', function (result) {
// 			expect(result.data).to.not.be.empty;
// 			done();
// 		});
// 	});

// 	it('returns an empty result if ridiculous search term is provided', function (done) {
// 		millennium.search('fhqwhgads', function (result) {
// 			expect(result.data).to.be.empty;
// 			done();
// 		});
// 	});

// 	it('returns a single result for insanely specific search', function (done) {
// 		millennium.search('medicine and health, Rhode Island', function (result) {
// 			expect(result.data.length).to.equal(1);
// 			done();
// 		});
// 	});

// 	it('returns an error object if there was an HTTP error', function (done) {
// 		nock.disableNetConnect();
// 		millennium.search('medicine', function (result) {
// 			nock.enableNetConnect();
// 			expect(result.data).to.be.undefined;
// 			expect(result.error).to.equal('Nock: Not allow net connect for "ucelinks.cdlib.org:8888"');
// 			done();
// 		});
// 	});
});
