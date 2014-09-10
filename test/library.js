var library = require('../routes/library.js');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;
var beforeEach = lab.beforeEach;

var result;

var res = {
	json: function(value) {
		result = value;
	}
}

describe('search', function () {
	beforeEach(function (done) {
		delete result;
		done();
	});

	it('returns an empty result if no search term provided', function (done) {
		var req = {
			query: {
				q: ''
			}
		};
		
		library.search(req, res);

		expect(result).to.deep.equal({data:[]});
		done();
	});
});
