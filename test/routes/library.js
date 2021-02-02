/*jshint expr: true*/

var rewire = require('rewire');

var events = require('events');
var eventEmitter = new events.EventEmitter();

var nock = require('nock');

nock('https://api3.libcal.com:443')
  .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
  .replyWithFile(200, __dirname + '/../fixtures/hours.json');

nock('https://lgapi.libapps.com:443')
  .get('/1.0/guides/100998,100994,101031,101035,101017,101014,101016,100993,100989,100980,100981,100974,100978,100984,100965?site_id=407')
  .replyWithFile(200, __dirname + '/../fixtures/guides.json');

var library = rewire('../../routes/library.js');

var Code = require('code'); 
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;

var beforeEach = lab.beforeEach;

describe('exports', function () {
  var moreThanAnHourAgo = Date.now() - (1000 * 60 * 60) - 1;

  beforeEach(function (done) {
    eventEmitter.removeAllListeners();
    nock.disableNetConnect();
    done();
  });

  it('should have properties for guides(), and hours()', function (done) {
    expect(typeof library.guides).to.equal('function');
    expect(typeof library.hours).to.equal('function');
    done();
  });

  describe('guides()', function () {

    it('should return a valid object', function (done) {
      var revert;
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

      revert = library.__set__('guides', {guides:[{title: 'title', href: 'href', desc: 'desc'}], lastUpdated: Date.now()});
      library.guides(null, resMock);
    });

    it('should fetch valid object if it current object is expired', function (done) {
      var updateGuidesAsyncMock = function () {
        eventEmitter.emit('guidesCallback');
      };

      var guidesMock = {
        lastUpdated: moreThanAnHourAgo
      };

      var revert = library.__set__({guides: guidesMock, updateGuidesAsync: updateGuidesAsyncMock});

      eventEmitter.on('guidesCallback', function () {
        revert();
        done();
      });

      library.guides(null, {json: function () {}});
    });

    it('should log an error if it receives a non-200 status code', function (done) {
      var messageLogged = false;
      var dataChecked = false;

      nock('https://lgapi.libapps.com:443')
        .get('/1.0/guides/100998,100994,101031,101035,101017,101014,101016,100993,100989,100980,100981,100974,100978,100984,100965?site_id=407')
        .reply(404, 'Not found');
      
      var guidesMock = {
        lastUpdated: moreThanAnHourAgo
      };
      var mockLogger = function (logMsg) {
        expect(logMsg).to.equal('updateGuidesAsync error: code 404');
        messageLogged = true;
        eventEmitter.emit('arewedoneyet');
      };
      var revert = library.__set__({guides: guidesMock, logger: mockLogger});

      var mockRes = {
        json: function (data) {
          expect(data).to.deep.equal(guidesMock);
          dataChecked = true;
          eventEmitter.emit('arewedoneyet');
        }
      };

      eventEmitter.on('arewedoneyet', function () {
        if (messageLogged && dataChecked) {
          revert();
          done();
        }
      });

      library.guides(null, mockRes);
    });

    it('should log an error if it receives invalid JSON', function (done) {
      var messageLogged = false;
      var dataChecked = false;

      nock('https://lgapi.libapps.com:443')
        .get('/1.0/guides/100998,100994,101031,101035,101017,101014,101016,100993,100989,100980,100981,100974,100978,100984,100965?site_id=407')
        .reply(200, 'Invalid JSON');

      var guidesMock = {
        lastUpdated: moreThanAnHourAgo
      };
      var mockLogger = function (logMsg) {
        expect(logMsg).to.contain('error parsing LibGuides JSON: Unexpected token I');
        messageLogged = true;
        eventEmitter.emit('arewedoneyet');
      };
      var revert = library.__set__({guides: guidesMock, logger: mockLogger});

      var mockRes = {
        json: function (data) {
          expect(data).to.deep.equal(guidesMock);
          dataChecked = true;
          eventEmitter.emit('arewedoneyet');
        }
      };

      eventEmitter.on('arewedoneyet', function () {
        if (messageLogged && dataChecked) {
          revert();
          done();
        }
      });

      library.guides(null, mockRes);
    });

    it('should log an error if there is an HTTPS error', function (done) {
      var messageLogged = false;
      var dataChecked = false;

      var guidesMock = {
        lastUpdated: moreThanAnHourAgo
      };
      var mockLogger = function (logMsg) {
        expect(logMsg).to.startWith('updateGuidesAsync error: Nock: No match for');
        messageLogged = true;
        eventEmitter.emit('arewedoneyet');
      };
      var revert = library.__set__({guides: guidesMock, logger: mockLogger});

      var mockRes = {
        json: function (data) {
          expect(data).to.deep.equal(guidesMock);
          dataChecked = true;
          eventEmitter.emit('arewedoneyet');
        }
      };

      eventEmitter.on('arewedoneyet', function () {
        if (messageLogged && dataChecked) {
          revert();
          done();
        }
      });

      library.guides(null, mockRes);
    });
  });

  describe('hours()', function () {

    var returnScheduleJson = function () {
      return {lastUpdated: Date.now(), locations: {'parnassus':[{day: 'day', date:'date', text:'text'}, {day: 'day', date:'date', text:'text'}], 'missionBay': [{day: 'day', date:'date', text:'text'},{day: 'day', date:'date', text:'text'}]}};
    };

    it('should return a valid object if it already has one loaded', function (done) {
      var revert;
      var resMock = {
        json: function (value) {
          expect(value.locations.parnassus.length).to.equal(2);
          expect(value.error).to.be.undefined;
          revert();
          done();
        }
      };

      revert = library.__set__('schedule', {get: returnScheduleJson});
      library.hours(null, resMock);
    });

    it('should fetch valid object if it has an expired object', function (done) {
      var revert = library.__set__('schedule', {
        get: function () {
          return {
            lastUpdated: moreThanAnHourAgo
          };
        },
        update: function () {
          revert();
          done();
        }
      });

      library.hours(null, {json: function () {}});
    });
  });
});

