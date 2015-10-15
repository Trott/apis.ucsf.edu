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

  describe('times()', function () {
    it('should return times for route at stop, omitting dropoff-only times', function (done) {
      var mockReq = {query: {routeId: 'black', stopId: 'lhts', startTime: '1427698800000'}};
      var mockRes = {json: function (data) {
        expect(data.times instanceof Array).to.be.true;
        expect(data.times.length).to.equal(39);
        expect(data.times[0].time).to.equal(1427722200);
        //expect(data.times[0].direction).to.be.null;
        // TODO: test that results are sorted
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops/ucsf%3Alhts/stoptimes/20150330?details=true&refs=true')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleTimes.json');

      shuttle.times(mockReq, mockRes);
    });
  });

  describe('routes()', function () {
    it('should return JSON for routes', function (done) {
      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {
          routes:[
            {id:{id:'va'},routeShortName:'VA',routeLongName:'VAMC - Parnassus'},
            {id:{id:'tan'},routeShortName:'Tan',routeLongName:'Parnassus - Laurel Heights - Mt. Zion'},
            {id:{id:'black'},routeShortName:'Black',routeLongName:'Parnassus - Mt. Zion - Laurel Heights'},
            {id:{id:'yellow'},routeShortName:'Yellow',routeLongName:'16th BART - MCB - 20th/Alabama - SFGH'},
            {id:{id:'gold'},routeShortName:'Gold',routeLongName:'Parnassus - Mt. Zion - Mission Bay - SFGH'},
            {id:{id:'grey'},routeShortName:'Grey',routeLongName:'Parnassus - Mission Bay'},
            {id:{id:'lime'},routeShortName:'Lime',routeLongName:'Parnassus - 55 Laguna Parking - BDC - MCB'},
            {id:{id:'pink'},routeShortName:'Pink',routeLongName:'Parnassus E/R - Kezar'},
            {id:{id:'blue'},routeShortName:'Blue',routeLongName:'Parnassus - SFGH - Mission Bay - Mt. Zion'},
            {id:{id:'purple'},routeShortName:'Purple',routeLongName:'Parnassus (Library) - 3360 Geary - Mt. Zion - 3360 Geary'},
            {id:{id:'green'},routeShortName:'Green',routeLongName:'Mission Bay - China Basin - 654 Minnesota'},
            {id:{id:'bronze'},routeShortName:'Bronze',routeLongName:'Aldea - ACC - Library - 6th - Dental - LPPI'},
            {id:{id:'red'},routeShortName:'Red',routeLongName:'Mission Bay - MCB - 16th St BART'}
          ]
        };

        expect(data).to.deep.equal(expectedResults);
        done();
      }};
      
      nock('http://localhost:8080')
        .get('/otp/routers/default/index/routes')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleRoutes.json');

      shuttle.routes(mockReq, mockRes);
    });
  });

  describe('stops()', function () {
    it('should return all stops if no options specified', function (done) {
      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {'stops':[
          {'id':{id:'Parnassus',agencyId:'ucsf'},'stopName':'Parnassus Campus','stopLat':37.763174,'stopLon':-122.459176},
          {'id':{id:'MB',agencyId:'ucsf'},'stopName':'Mission Bay Campus','stopLat':37.76793,'stopLon':-122.391009},
          {'id':{id:'hospital',agencyId:'ucsf'},'stopName':'Mission Bay Hospital','stopLat':37.766373,'stopLon':-122.391379},
          {'id':{id:'16thbart',agencyId:'ucsf'},'stopName':'16th St. BART','stopLat':37.765128,'stopLon':-122.419402},
          {'id':{id:'75behr',agencyId:'ucsf'},'stopName':'Aldea Housing','stopLat':37.758793,'stopLon':-122.454181},
          {'id':{id:'3360 Geary',agencyId:'ucsf'},'stopName':'3360 Geary','stopLat':37.78161,'stopLon':-122.455075},
          {'id':{id:'100 Buchanan',agencyId:'ucsf'},'stopName':'Buchanan Dental Center','stopLat':37.770791,'stopLon':-122.426684},
          {'id':{id:'sfgh',agencyId:'ucsf'},'stopName':'SFGH','stopLat':37.7548539352877,'stopLon':-122.40492649376392},
          {'id':{id:'caltrain',agencyId:'ucsf'},'stopName':'Caltrain','stopLat':37.7769459,'stopLon':-122.395165},
          {'id':{id:'mcb',agencyId:'ucsf'},'stopName':'Mission Center Building','stopLat':37.767326,'stopLon':-122.414519},
          {'id':{id:'parkezar',agencyId:'ucsf'},'stopName':'Kezar Lot','stopLat':37.767188,'stopLon':-122.453403},
          {'id':{id:'lhts',agencyId:'ucsf'},'stopName':'Laurel Heights','stopLat':37.786592,'stopLon':-122.448552},
          {'id':{id:'2300 Harrison',agencyId:'ucsf'},'stopName':'20th & Alabama','stopLat':37.759072,'stopLon':-122.411562},
          {'id':{id:'veteran',agencyId:'ucsf'},'stopName':'VA Medical Center','stopLat':37.782019,'stopLon':-122.504996},
          {'id':{id:'surgedown',agencyId:'ucsf'},'stopName':'Surge/Woods','stopLat':37.760757,'stopLon':-122.456163},
          {'id':{id:'chinbasn',agencyId:'ucsf'},'stopName':'China Basin','stopLat':37.776594,'stopLon':-122.39223},
          {'id':{id:'654minn',agencyId:'ucsf'},'stopName':'654 Minnesota','stopLat':37.761834,'stopLon':-122.390661},
          {'id':{id:'499ill',agencyId:'ucsf'},'stopName':'499 Illinois','stopLat':37.7659378,'stopLon':-122.3878759},
          {'id':{id:'mtzion',agencyId:'ucsf'},'stopName':'Mt. Zion','stopLat':37.78524781704753,'stopLon':-122.439474016428}
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
      var mockReq = {query: {routeId: 'blue'}};
      var mockRes = {json: function (data) {
        var expectedResults = {
            stops:[
              {'id':{id:'parlppi',agencyId:'ucsf'}, stopName:'401 Parnassus (LPPI)', stopLat:37.7638174033811, stopLon:-122.45648592710495, parentStation:'Parnassus'},
              {'id':{id:'missb4we',agencyId:'ucsf'}, stopName:'Mission Bay (west side of street)', stopLat:37.76793, stopLon:-122.391009, parentStation:'MB'},
              {'id':{id:'sfgh',agencyId:'ucsf'}, stopName:'SFGH', stopLat:37.7548539352877, stopLon:-122.40492649376392},
              {'id':{id:'mtzion',agencyId:'ucsf'}, stopName:'Mt. Zion', stopLat:37.78524781704753, stopLon:-122.439474016428},
              {'id':{id:'hospital',agencyId:'ucsf'}, stopName:'Mission Bay Hospital', stopLat:37.766373, stopLon:-122.391379}
            ],
          route:{
            id:{id:'blue'},routeShortName:'Blue'
          }
        };
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
      var mockReq = {query: {routeId: 'blue'}};
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
      var mockReq = {query: {routeId: 'magenta'}};
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

