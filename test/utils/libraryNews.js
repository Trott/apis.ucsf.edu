/*jshint expr: true*/

// var rewire = require('rewire');
var libraryNews = require('../../utils/libraryNews.js');

var Code = require('code'); 
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;

var beforeEach = lab.beforeEach;
// var afterEach = lab.afterEach;

var nock = require('nock');


describe('exports', function () {
  // var reset;

//   beforeEach(function (done) {
//     nock.disableNetConnect();
//     reset = librarySchedule.__set__({schedule: {}});
//     done();
//   });

//   afterEach(function (done) {
//     nock.cleanAll();
//     reset();
//     done();
//   });

  it('should have properties for fetch()', function (done) {
    expect(libraryNews.fetch).to.be.a.function();
    done();
  });

  describe('fetch()', function () {

    beforeEach(function (done) {
      nock.disableNetConnect();
      done();
    });

    it('should return the news feed object to the callback', function (done) {
      nock('https://blogs.library.ucsf.edu')
        .get('/newstest/feed/')
        .replyWithFile(200, __dirname + '/../fixtures/news.rss');

      var callback = function (error, data) {
        expect(data).to.deep.equal({
          rss: { 
            channel: [ 
              { item: [
                { title: ['Everybody To The Limit!'] },
                { title: ['The System Is Down'] }
              ]}
            ] 
          }
        });
        done();
      };

      libraryNews.fetch(callback);
    });

    it('should return an error object if the network is not available', function (done) {
      var callback = function (error) {
        expect(error).to.be.an.instanceof(Error);
        done();
      };

      libraryNews.fetch(callback);
    });

    it('should return an error object if the server returns a 404', function (done) {
      nock('https://blogs.library.ucsf.edu')
        .get('/newstest/feed/')
        .reply(404);

      var callback = function (error) {
        expect(error).to.be.an.instanceof(Error);
        done();
      };

      libraryNews.fetch(callback);
    });
  });

//   describe('update()', function () {
//     it('should return the schedule in the expected format', function (done) {
//       nock('http://api.libcal.com:80')
//         .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
//         .replyWithFile(200, __dirname + '/../fixtures/hours.json');

//       librarySchedule.once('update', function () {
//         var schedule = librarySchedule.get();
//         expect(schedule.locations).to.be.an.object();
//         expect(schedule.locations.parnassus[0].day).not.to.contain('Invalid');
//         expect(schedule.lastUpdated).to.be.a.number();
//         done();
//       });

//       librarySchedule.update();
//     });

//     it('should log an error message if HTTP status code is not 200', function (done) {
//       nock('http://api.libcal.com:80')
//         .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
//         .reply(404, '404ed! Not found!');

//       var mockLogger = function (logMsg) {
//         expect(logMsg).to.equal('updateScheduleAsync error: code 404');
//         done();
//       };

//       librarySchedule.update({logger: mockLogger});
//     });

//     it('should ignore entries with missing properties', function (done) {
//       nock('http://api.libcal.com:80')
//         .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
//         .replyWithFile(200, __dirname + '/../fixtures/borkedHours.json');

//       librarySchedule.once('update', function () {
//         var schedule = librarySchedule.get();
//         expect(schedule.locations.parnassus[0]).to.deep.equal({
//               'day': 'Sun',
//               'date': 'Sep 21',
//               'text': '12pm - 10pm'
//             }
//         );
//         expect(schedule.locations.parnassus[1].text).to.equal('');
//         done();
//       });

//       librarySchedule.update({date: '2014-09-21'});
//     });

//     it('should reject invalid JSON', function (done) {
//       var logged = false;

//       nock('http://api.libcal.com:80')
//         .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
//         .reply(200, 'invalid JSON!');

//       var mockLogger = function (logMsg) {
//         expect(logMsg).to.equal('error parsing LibCal JSON: Unexpected token i');
//         logged = true;
//       };

//       librarySchedule.once('update', function () {
//         expect(logged).to.equal(true);
//         expect(librarySchedule.get().locations).to.deep.equal({});
//         done();
//       });

//       librarySchedule.update({logger: mockLogger});
//     });

//     it('should log an error if there is an HTTP error', function (done) {
//       var mockLogger = function (logMsg) {
//         expect(logMsg).to.equal('updateScheduleAsync error: Nock: Not allow net connect for "api.libcal.com:80"');
//         done();
//       };

//       librarySchedule.update({logger: mockLogger});
//     });
//   });

//   describe('get()', function () {
//     it('should fetch hours for Mission Bay Hub', function (done) {
//       nock('http://api.libcal.com:80')
//         .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
//         .replyWithFile(200, __dirname + '/../fixtures/hours.json');

//       librarySchedule.on('update', function () {
//         var schedule = librarySchedule.get();
//         expect(schedule.locations.missionBayHub.length).to.equal(7);
//         schedule.locations.missionBayHub.forEach(function (value) {
//           expect(value.text).to.equal('24 hours');
//         });

//         done();
//       });

//       librarySchedule.update({date: '2014-09-28'});
//     });
//   });
});