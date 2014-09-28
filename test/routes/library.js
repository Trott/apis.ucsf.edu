/*jshint expr: true*/

var rewire = require('rewire');

var events = require('events');
var eventEmitter = new events.EventEmitter();

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

	describe('search()', function () {
		it('should not set plugin-level callback if async is not specified in search()', function (done) {
			var amalgamaticMock = {
				search: function (options) {
					expect(options.pluginCallback).to.be.undefined;
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
					expect(typeof options.pluginCallback).to.equal('function');
					revert();
					done();
				}
			};
			var revert = library.__set__('amalgamatic', amalgamaticMock);

			library.search(
				{query: {q: 'medicine', async: ''}},
				{write: function () {}, writeHead: function () {}, close: function () {}}
			);
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

		it('should fire main callback for non async search', function (done) {
			nock('http://ucelinks.cdlib.org:8888')
				.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=medicine')
				.reply('200', '<a class="Results" href="#">Medicine</a><a class="Results" href="#">Medicine</a>');

			var mockJson = function (value) {
				expect(value.sfx.data.length).to.equal(2);
				done();
			};

			library.search({query: {q: 'medicine', c: ['sfx']}}, {json: mockJson});
		});

		it('should fire plugin callback for async search', function (done) {
			nock('http://ucelinks.cdlib.org:8888')
				.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=medicine')
				.reply('200', '<a class="Results" href="#">Medicine</a><a class="Results" href="#">Medicine</a>');

			var mockWriteHead = function (status, value) {
				expect(status).to.equal(200);
				expect(value).to.deep.equal({'Content-Type': 'text/event-stream'});
			};

			var mockWrite = function () {
			};

			var mockEnd = function () {
				done();
			};

			library.search({query: {q: 'medicine', c: ['sfx'], async: ''}}, {writeHead: mockWriteHead, write: mockWrite, end: mockEnd});
		});
	});

	describe('guides()', function () {
		it('should return a valid object', function (done) {
			var resMock = {
				json: function (value) {
					expect(value.guides.length).to.equal(1);
					expect(value.guides[0].title).to.equal('title');
					expect(value.guides[0].href).to.equal('href');
					expect(value.guides[0].desc).to.equal('desc');
					expect(value.error).to.be.undefined;
					revert();
					done();
				}
			};

			var revert = library.__set__('guides', {guides:[{title: 'title', href: 'href', desc: 'desc'}], lastUpdated: Date.now()});
			library.guides(null, resMock);
		});

		it('should fetch valid object if it does not already have one', function (done) {
			var updateGuidesAsyncMock = function () {
				eventEmitter.emit('mainCallback');
			};

			var guidesMock = {};

			var revert = library.__set__({guides: guidesMock, updateGuidesAsync: updateGuidesAsyncMock});

			eventEmitter.on('mainCallback', function () {
				revert();
				done();
			});

			library.guides(null, {json: function () {}});
		});
	});

  describe('hours()', function () {
		it('should return a valid object', function (done) {
			var resMock = {
				json: function (value) {
					expect(value.locations.parnassus.length).to.equal(2);
					expect(value.error).to.be.undefined;
					revert();
					done();
				}
			};

			var revert = library.__set__('schedule', {lastUpdated: Date.now(), locations: {'parnassus':[{day: 'day', date:'date', text:'text'}, {day: 'day', date:'date', text:'text'}], 'missionBay': [{day: 'day', date:'date', text:'text'},{day: 'day', date:'date', text:'text'}]}});
			library.hours(null, resMock);
		});
	});
});

