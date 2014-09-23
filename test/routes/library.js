/*jshint expr: true*/

var rewire = require('rewire');

var nock = require('nock');
nock.disableNetConnect();

nock('http://api.libcal.com:80')
	.get('/api_hours_grid.php?iid=138&format=json&weeks=2')
	.replyWithFile(200, __dirname + '/../fixtures/hours.json');

nock('http://lgapi.libapps.com:80')
	.get('/1.0/guides/100978,100985,100999,100992,100980,100974,100998,100991,100979,100984,100994,13690,100988,101010,100986,101021,100983,100966,100975,100967,101006,100971,101002,100996?site_id=407')
	.replyWithFile(200, __dirname + '/../fixtures/guides.json');

var library = rewire('../../routes/library.js');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;

describe('exports', function () {
	it('should have properties for search(), guides(), and hours()', function (done) {
		expect(typeof library.search).to.equal('function');
		expect(typeof library.guides).to.equal('function');
		expect(typeof library.hours).to.equal('function');
		done();
	});

	describe('search', function () {
		it('should set async results to false if async is not specified in search()', function (done) {
			var amalgamaticMock = {
				search: function (options) {
					expect(options.async).to.be.false;
					revert();
					done();
				}
			};
			var revert = library.__set__('amalgamatic', amalgamaticMock);

			library.search({query: {q: 'medicine'}});
		});

		it('should set async results to true if async is specified in search()', function (done) {
			var amalgamaticMock = {
				search: function (options) {
					expect(options.async).to.be.true;
					revert();
					done();
				}
			};
			var revert = library.__set__('amalgamatic', amalgamaticMock);

			library.search({query: {q: 'medicine', async: ''}});
		});

		it('should not set collections if no collections are specified', function (done) {
			var amalgamaticMock = {
				search: function (options) {
					expect(options.collections).to.be.undefined;
					revert();
					done();
				}
			};
			var revert = library.__set__('amalgamatic', amalgamaticMock);

			library.search({query: {q: 'medicine'}});
		});

		it('should set collections if collections are specified', function (done) {
			var amalgamaticMock = {
				search: function (options) {
					expect(options.collections).to.deep.equal(['foo', 'bar']);
					revert();
					done();
				}
			};
			var revert = library.__set__('amalgamatic', amalgamaticMock);

			library.search({query: {q: 'medicine', 'c': ['foo', 'bar']}});
		});
	});
});

