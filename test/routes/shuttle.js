/*jshint expr: true*/

var rewire = require('rewire');

var events = require('events');
var eventEmitter = new events.EventEmitter();

var nock = require('nock');

var shuttle = rewire('../../routes/shuttle.js');
var revert;

var Code = require('code'); 
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;

var beforeEach = lab.beforeEach;

describe('exports', function () {
  beforeEach(function (done) {
    eventEmitter.removeAllListeners();
    nock.disableNetConnect();
    if (typeof revert === 'function') {
      revert();
    }
    done();
  });

  it('should have properties for stops(), routes(), times(), plans(), and predictions()', function (done) {
    expect(typeof shuttle.stops).to.equal('function');
    expect(typeof shuttle.routes).to.equal('function');
    expect(typeof shuttle.times).to.equal('function');
    expect(typeof shuttle.plan).to.equal('function');
    expect(typeof shuttle.predictions).to.equal('function');
    done();
  });

  describe('stops()', function () {
    it('should return all stops if no options specified', function (done) {
      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {'stops':[
          {'id':{id:'ucsf:Parnassus'},'stopName':'Parnassus Campus','stopLat':37.763174,'stopLon':-122.459176},
          {'id':{id:'ucsf:MB'},'stopName':'Mission Bay Campus','stopLat':37.76793,'stopLon':-122.391009},
          {'id':{id:'ucsf:hospital'},'stopName':'Mission Bay Hospital','stopLat':37.766373,'stopLon':-122.391379},
          {'id':{id:'ucsf:16thbart'},'stopName':'16th St. BART','stopLat':37.765128,'stopLon':-122.419402},
          {'id':{id:'ucsf:75behr'},'stopName':'Aldea Housing','stopLat':37.758793,'stopLon':-122.454181},
          {'id':{id:'ucsf:3360 Geary'},'stopName':'3360 Geary','stopLat':37.78161,'stopLon':-122.455075},
          {'id':{id:'ucsf:100 Buchanan'},'stopName':'Buchanan Dental Center','stopLat':37.770791,'stopLon':-122.426684},
          {'id':{id:'ucsf:sfgh'},'stopName':'SFGH','stopLat':37.7548539352877,'stopLon':-122.40492649376392},
          {'id':{id:'ucsf:caltrain'},'stopName':'Caltrain','stopLat':37.7769459,'stopLon':-122.395165},
          {'id':{id:'ucsf:mcb'},'stopName':'Mission Center Building','stopLat':37.767326,'stopLon':-122.414519},
          {'id':{id:'ucsf:parkezar'},'stopName':'Kezar Lot','stopLat':37.767188,'stopLon':-122.453403},
          {'id':{id:'ucsf:lhts'},'stopName':'Laurel Heights','stopLat':37.786592,'stopLon':-122.448552},
          {'id':{id:'ucsf:2300 Harrison'},'stopName':'20th & Alabama','stopLat':37.759072,'stopLon':-122.411562},
          {'id':{id:'ucsf:veteran'},'stopName':'VA Medical Center','stopLat':37.782019,'stopLon':-122.504996},
          {'id':{id:'ucsf:surgedown'},'stopName':'Surge/Woods','stopLat':37.760757,'stopLon':-122.456163},
          {'id':{id:'ucsf:chinbasn'},'stopName':'China Basin','stopLat':37.776594,'stopLon':-122.39223},
          {'id':{id:'ucsf:654minn'},'stopName':'654 Minnesota','stopLat':37.761834,'stopLon':-122.390661},
          {'id':{id:'ucsf:499ill'},'stopName':'499 Illinois','stopLat':37.7659378,'stopLon':-122.3878759},
          {'id':{id:'ucsf:mtzion'},'stopName':'Mt. Zion','stopLat':37.78524781704753,'stopLon':-122.439474016428}
        ]};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleStops.json');

      shuttle.stops(mockReq, mockRes);
    });

    it('should return just the blue stops if a routeId is specified', function (done) {
      var mockReq = {query: {routeId: 'ucsf:blue'}};
      var mockRes = {json: function (data) {
        var expectedResults = {'stops':[
          {'id':{id:'ucsf:parlppi'}, stopName:'401 Parnassus (LPPI)', stopLat:37.7638174033811, stopLon:-122.45648592710495, parentStation:'ucsf:Parnassus'},
          {'id':{id:'ucsf:missb4we'}, stopName:'Mission Bay (west side of street)', stopLat:37.76793, stopLon:-122.391009, parentStation:'ucsf:MB'},
          {'id':{id:'ucsf:sfgh'}, stopName:'SFGH', stopLat:37.7548539352877, stopLon:-122.40492649376392},
          {'id':{id:'ucsf:mtzion'}, stopName:'Mt. Zion', stopLat:37.78524781704753, stopLon:-122.439474016428},
          {'id':{id:'ucsf:hospital'}, stopName:'Mission Bay Hospital', stopLat:37.766373, stopLon:-122.391379}
        ]};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/routes/ucsf%3Ablue/stops?detail=true&refs=true') //?agency=ucsf&references=true&extended=true&id=blue')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsBlue.json');

      shuttle.stops(mockReq, mockRes);  
    });

    it('should report an error if HTTP response code is not 200 or 404', function (done) {
      var errorLogged = false;
      var errorSent = false;

      eventEmitter.once('errorLogged', function () {
        errorLogged = true;
        if (errorSent) {
          done();
        }
      });

      eventEmitter.once('errorSent', function () {
        errorSent = true;
        if (errorLogged) {
          done();
        }
      });

      revert = shuttle.__set__('logger', function (value) {
        expect(value).to.equal('shuttle/stops error: code 400');
        eventEmitter.emit('errorLogged');
      });

      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {error: 'shuttle/stops error: code 400'};
        expect(data).to.deep.equal(expectedResults);
        eventEmitter.emit('errorSent');
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops')
        .reply(400, 'FOUR ZERO ZERO');

      shuttle.stops(mockReq, mockRes);      
    });

    it('should return an empty array for stops if the JSON does not contain the required property', function (done) {
      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {stops: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops')
        .replyWithFile(200, __dirname + '/../fixtures/borkedShuttleStops.json');

      shuttle.stops(mockReq, mockRes);  
    });

    it('should return an empty array for stops if JSON is empty array', function (done) {
      var mockReq = {query: {routeId: 'ucsf:blue'}};
      var mockRes = {json: function (data) {
        var expectedResults = {stops: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/routes/ucsf%3Ablue/stops?detail=true&refs=true')
        .replyWithFile(200, __dirname + '/../fixtures/borkedShuttleStopsBlue.json');

      shuttle.stops(mockReq, mockRes); 
    });

    it('should return an empty array for stops and empty object for route if required property is an object without route and stops properties', function (done) {
      var mockReq = {query: {routeId: 'ucsf:magenta'}};
      var mockRes = {json: function (data) {
        var expectedResults = {stops: [], route:{}};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/routes/ucsf%3Amagenta/stops?detail=true&refs=true')
        .reply(404, __dirname + '/../fixtures/borkedShuttleStopsMagenta.json');

      shuttle.stops(mockReq, mockRes); 
    });
  });
});

