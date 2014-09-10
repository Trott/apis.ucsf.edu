var library = require('../routes/library.js');

var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;

var res = {
	json: function(value) {
		emitter.emit('end', value);
	}
}

describe('search', function () {
	it('returns an empty result if no search term provided', function (done) {
		var req = {
			query: {
				q: ''
			}
		};

		emitter.on('end', function (result) {
			expect(result).to.deep.equal({data:[]});
			done();
		})
		
		library.search(req, res);
	});

	// it('returns results if a non-ridiculous search term is provided', function (done) {
	// 	var req = {
	// 		query: {
	// 			q: 'medicine'
	// 		}
	// 	};

	// 	emitter.on('end', function (result) {
	// 		expect(result.data.length > 0).to.equal(true);
	// 		done();
	// 	})

	// 	library.search(req, res);
	// });
});
