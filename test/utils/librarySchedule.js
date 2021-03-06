/*jshint expr: true*/

var rewire = require('rewire');

var nock = require('nock');

var librarySchedule = rewire('../../utils/librarySchedule.js');

var Code = require('code'); 
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;

var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;

describe('exports', function () {
  var reset;

  beforeEach(function (done) {
    nock.disableNetConnect();
    reset = librarySchedule.__set__({schedule: {}});
    done();
  });

  afterEach(function (done) {
    nock.cleanAll();
    reset();
    done();
  });

  it('should have properties for update() and get()', function (done) {
    expect(typeof librarySchedule.update).to.equal('function');
    expect(typeof librarySchedule.get).to.equal('function');
    done();
  });

  describe('update()', function () {
    it('should return the schedule in the expected format', function (done) {
      nock('https://api3.libcal.com:443')
        .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
        .replyWithFile(200, __dirname + '/../fixtures/hours.json');

      librarySchedule.once('update', function () {
        var schedule = librarySchedule.get();
        expect(schedule.locations).to.be.an.object();
        expect(schedule.locations.parnassus[0].day).not.to.contain('Invalid');
        expect(schedule.lastUpdated).to.be.a.number();
        done();
      });

      librarySchedule.update();
    });

    it('should log an error message if HTTP status code is not 200', function (done) {
      nock('https://api3.libcal.com:443')
        .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
        .reply(404, '404ed! Not found!');

      var mockLogger = function (logMsg) {
        expect(logMsg).to.equal('updateScheduleAsync error: code 404');
        done();
      };

      librarySchedule.update({logger: mockLogger});
    });

    it('should ignore entries with missing properties', function (done) {
      nock('https://api3.libcal.com:443')
        .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
        .replyWithFile(200, __dirname + '/../fixtures/borkedHours.json');

      librarySchedule.once('update', function () {
        var schedule = librarySchedule.get();
        expect(schedule.locations.parnassus[0]).to.deep.equal({
              'day': 'Sun',
              'date': 'Aug 17',
              'text': '12pm - 10pm'
            }
        );
        expect(schedule.locations.parnassus[1].text).to.equal('');
        done();
      });

      librarySchedule.update({date: '2014-08-17'});
    });

    it('should reject invalid JSON', function (done) {
      var logged = false;

      nock('https://api3.libcal.com:443')
        .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
        .reply(200, 'invalid JSON!');

      var mockLogger = function (logMsg) {
        expect(logMsg).to.contain('error parsing LibCal JSON: Unexpected token i');
        logged = true;
      };

      librarySchedule.once('update', function () {
        expect(logged).to.equal(true);
        expect(librarySchedule.get().locations).to.deep.equal({});
        done();
      });

      librarySchedule.update({logger: mockLogger});
    });

    it('should log an error if there is an HTTP error', function (done) {
      var mockLogger = function (logMsg) {
        expect(logMsg).to.startWith('updateScheduleAsync error: Nock: Not allow net connect for ');
        done();
      };

      librarySchedule.update({logger: mockLogger});
    });
  });

  describe('get()', function () {
    it('should fetch hours for Mission Bay Hub', function (done) {
      nock('https://api3.libcal.com:443')
        .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
        .replyWithFile(200, __dirname + '/../fixtures/hours.json');

      librarySchedule.on('update', function () {
        var schedule = librarySchedule.get();
        expect(schedule.locations.missionBayHub.length).to.equal(7);
        schedule.locations.missionBayHub.forEach(function (value) {
          expect(value.text).to.equal('24 hours');
        });

        done();
      });

      librarySchedule.update({date: '2014-09-28'});
    });
  });
});