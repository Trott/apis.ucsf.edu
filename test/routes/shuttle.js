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


var routeIdComparator = function (a, b) {
  if (a.id.id < b.id.id) {
    return -1;
  }
  return 1;
};

describe('exports', function () {
  beforeEach(function (done) {
    eventEmitter.removeAllListeners();
    nock.disableNetConnect();
    if (typeof revert === 'function') {
      revert();
    }
    done();
  });

  it('should have properties for stops(), routes(), times(), plan(), and predictions()', function (done) {
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
        expect(data.times[0].direction).to.equal(undefined);
        // TODO: test that results are sorted
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops/ucsf%3Alhts/stoptimes/20150330?details=true&refs=true')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleTimes.json');

      shuttle.times(mockReq, mockRes);
    });

    it('should return undefined for direction if no stopTime found', function (done) {
      revert = shuttle.__set__('transit', {agencies: {ucsf: {routes: {black: {trips: {
        black_a: {stops: {findAll: function () {return {find: function() { return null; }}; }}},
        black_b: {stops: {findAll: function () {return {find: function() { return null; }}; }}}
      }}}}}});
      var mockReq = {query: {routeId: 'black', stopId: 'lhts', startTime: '1427698800000'}};
      var mockRes = {json: function (data) {
        expect(data.times instanceof Array).to.be.true;
        expect(data.times[0].direction).to.equal(undefined);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops/ucsf%3Alhts/stoptimes/20150330?details=true&refs=true')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleTimes.json');

      shuttle.times(mockReq, mockRes);
    });

    it('should ignore entries that do not have a .pattern a .pattern.id', function (done) {
      var mockReq = {query: {routeId: 'black', stopId: 'lhts', startTime: '1427698800000'}};
      var mockRes = {json: function (data) {
        expect(data.times instanceof Array).to.be.true;
        expect(data.times.length).to.equal(39);
        expect(data.times[0].time).to.equal(1427722200);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops/ucsf%3Alhts/stoptimes/20150330?details=true&refs=true')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleTimesHalfBorked.json');

      shuttle.times(mockReq, mockRes);
    });

    it('should return whatever OTP gave us if JSON is not parsed into an array', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {routeId: 'black', stopId: 'lhts', startTime: '1427698800000'}};
      var mockRes = {
        json: function (data) {
          expect(data).to.deep.equal({'come on': 'fhqwhgads'});
          done();
        }
      };

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops/ucsf%3Alhts/stoptimes/20150330?details=true&refs=true')
        .reply(200, '{"come on": "fhqwhgads"}');

      shuttle.times(mockReq, mockRes);     
    });

    it('should return an error if the JSON is borked', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {routeId: 'black', stopId: 'lhts', startTime: '1427698800000'}};
      var mockRes = {
        json: function (data) {
          expect(data.error).to.exist();
          done();
        }
      };

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops/ucsf%3Alhts/stoptimes/20150330?details=true&refs=true')
        .reply(200, '{');

      shuttle.times(mockReq, mockRes);
    });

    it('should return an error if there is an HTTP error event', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {routeId: 'black', stopId: 'lhts', startTime: '1427698800000'}};
      var mockRes = {
        json: function (data) {
          expect(data.error).to.exist();
          done();
        }
      };

      shuttle.times(mockReq, mockRes);
    });

    it('should return an error if an HTTP error code is returned', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {routeId: 'black', stopId: 'lhts', startTime: '1427698800000'}};
      var mockRes = {
        json: function (data) {
          expect(data.error).to.exist();
          done();
        }
      };

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops/ucsf%3Alhts/stoptimes/20150330?details=true&refs=true')
        .reply(500, 'fhqwhgads');

      shuttle.times(mockReq, mockRes);      
    });

    it('should defer response if gtfs.noPickup is not populated', function (done) {
      revert = shuttle.__set__('gtfs', {
        noPickup: [],
        on: function (event, handler) {
          expect(event).to.equal('load');
          expect(typeof handler).to.equal('function');
          done();
        }
      });
      var mockReq = {query: {routeId: 'black', stopId: 'lhts', startTime: '1427698800000'}};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/stops/ucsf%3Alhts/stoptimes/20150330?details=true&refs=true')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleTimes.json');

      shuttle.times(mockReq);
    });
  });

  describe('routes()', function () {
    it('should return JSON for routes', function (done) {
      var mockReq = {query: {}};
      var mockRes = {
        json: function (data) {
          var expectedResults = {
            routes: [
              { id: { id: 'black' }, routeShortName: 'Black', routeLongName: 'Parnassus - Mt. Zion - Laurel Heights' },
              { id: { id: 'blue' }, routeShortName: 'Blue', routeLongName: 'Parnassus - SFGH - Mission Bay - Mt. Zion' },
              { id: { id: 'bronze' }, routeShortName: 'Bronze', routeLongName: 'Aldea - ACC - Library - 6th - Dental - LPPI' },
              { id: { id: 'gold' }, routeShortName: 'Gold', routeLongName: 'Parnassus - Mt. Zion - Mission Bay - SFGH' },
              { id: { id: 'green' }, routeShortName: 'Green', routeLongName: 'Mission Bay - China Basin - 654 Minnesota' },
              { id: { id: 'grey' }, routeShortName: 'Grey', routeLongName: 'Parnassus - Mission Bay' },
              { id: { id: 'lime' }, routeShortName: 'Lime', routeLongName: 'Parnassus - 55 Laguna Parking - BDC - MCB' },
              { id: { id: 'pink' }, routeShortName: 'Pink', routeLongName: 'Parnassus E/R - Kezar' },
              { id: { id: 'purple' }, routeShortName: 'Purple', routeLongName: 'Parnassus (Library) - 3360 Geary - Mt. Zion - 3360 Geary' },
              { id: { id: 'red' }, routeShortName: 'Red', routeLongName: 'Mission Bay - MCB - 16th St BART' },
              { id: { id: 'tan' }, routeShortName: 'Tan', routeLongName: 'Parnassus - Laurel Heights - Mt. Zion' },
              { id: { id: 'va' }, routeShortName: 'VA', routeLongName: 'VAMC - Parnassus' },
              { id: { id: 'yellow' }, routeShortName: 'Yellow', routeLongName: '16th BART - MCB - 20th/Alabama - SFGH' }
            ]
          };

          expect(data.routes.sort(routeIdComparator)).to.deep.equal(expectedResults.routes);
          done();
        }
      };
      
      nock('http://localhost:8080')
      .get('/otp/routers/default/index/routes')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleRoutes.json');

      shuttle.routes(mockReq, mockRes);
    });

    it('should return an empty result if JSON is borked', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {}};
      var mockRes = {
        json: function (data) {
          var expectedResults = {
            routes: []
          };

          expect(data.routes).to.deep.equal(expectedResults.routes);
          done();
        }
      };
      
      nock('http://localhost:8080')
      .get('/otp/routers/default/index/routes')
      .reply(200, '{');

      shuttle.routes(mockReq, mockRes);
    });

    it('should return an error if there is an HTTP error event and no stopId is provided', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {}};
      var mockRes = {
        json: function (data) {
          expect(data.error).to.exist();
          done();
        }
      };

      shuttle.routes(mockReq, mockRes);
    });

    it('should return an error if there is an HTTP error event and a stopId is provided', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {stopId: 'mcb'}};
      var mockRes = {
        json: function (data) {
          expect(data.error).to.exist();
          done();
        }
      };

      shuttle.routes(mockReq, mockRes);
    });

    it('should get the routes for a specified stop', function (done) {
      var mockReq = {query: {stopId: 'mcb'}};
      var mockRes = {
        json: function (data) {
          var expectedResults = {
            stop:{
              id:{id:'mcb',agencyId:'ucsf'},
              stopName:'Mission Center Building',
              stopLat:37.767326,
              stopLon:-122.414519
            },
            routes:[
              {id:{id:'lime'},routeShortName:'Lime',routeLongName:'Parnassus - 55 Laguna Parking - BDC - MCB'},
              {id:{id:'red'},routeShortName:'Red',routeLongName:'Mission Bay - MCB - 16th St BART'},
              {id:{id:'yellow'},routeShortName:'Yellow',routeLongName:'16th BART - MCB - 20th/Alabama - SFGH'}
            ]
          };

          expect(data).to.deep.equal(expectedResults);
          done();
        }
      };

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops/ucsf:mcb/routes')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleRoutesMcb.json');

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStops.json');

      shuttle.routes(mockReq, mockRes);
    });

    it('should return all the routes for a parent station', function (done) {
      var mockReq = {query: {stopId: 'Parnassus'}};
      var mockRes = {
        json: function (data) {
          var expectedResults = {
            stop:{
              id:{id:'Parnassus',agencyId:'ucsf'},
              stopName:'Parnassus Campus',
              stopLat:37.763174,
              stopLon:-122.459176
            },
            routes:[
              {id:{id:'black'},routeShortName:'Black',routeLongName:'Parnassus - Mt. Zion - Laurel Heights'},
              {id:{id:'blue'},routeShortName:'Blue',routeLongName:'Parnassus - SFGH - Mission Bay - Mt. Zion'},
              {id:{id:'bronze'},routeShortName:'Bronze',routeLongName:'Aldea - ACC - Library - 6th - Dental - LPPI'},
              {id:{id:'gold'},routeShortName:'Gold',routeLongName:'Parnassus - Mt. Zion - Mission Bay - SFGH'},
              {id:{id:'grey'},routeShortName:'Grey',routeLongName:'Parnassus - Mission Bay'},
              {id:{id:'lime'},routeShortName:'Lime',routeLongName:'Parnassus - 55 Laguna Parking - BDC - MCB'},
              {id:{id:'pink'},routeShortName:'Pink',routeLongName:'Parnassus E/R - Kezar'},
              {id:{id:'purple'},routeShortName:'Purple',routeLongName:'Parnassus (Library) - 3360 Geary - Mt. Zion - 3360 Geary'},
              {id:{id:'tan'},routeShortName:'Tan',routeLongName:'Parnassus - Laurel Heights - Mt. Zion'},
              {id:{id:'va'},routeShortName:'VA',routeLongName:'VAMC - Parnassus'}
            ]
          };

          data.routes = data.routes.sort(routeIdComparator);
          expect(data).to.deep.equal(expectedResults);
          done();
        }
      };

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops/ucsf:library/')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsUcsfLibrary.json');

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops/ucsf:library/routes')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsRoutesUcsfLibrary.json');

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops/ucsf:parlppi/routes')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsRoutesParlppi.json');


      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops/ucsf:paracc/routes')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsRoutesParacc.json');

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStops.json');

      shuttle.routes(mockReq, mockRes);
    });

    it('should report an error if HTTP status is not 200 and no stopId is specified', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {}};
      var mockRes = {
        json: function (data) {
          var expectedResults = {
            error: 'shuttle/routes error: code 500'
          };

          expect(data).to.deep.equal(expectedResults);
          done();
        }
      };

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/routes')
      .reply(500, 'server error');

      shuttle.routes(mockReq, mockRes);      
    });

    it('should report an error if HTTP status is not 200 and a stopId is specified', function (done) {
      revert = shuttle.__set__('logger', function() {});
      var mockReq = {query: {stopId: 'mcb'}};
      var mockRes = {
        json: function (data) {
          var expectedResults = {
            error: 'shuttle/routes error: code 500'
          };

          expect(data).to.deep.equal(expectedResults);
          done();
        }
      };

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops/ucsf:mcb/routes')
      .reply(500, 'server error');

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops')
      .reply(500, 'server error');

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
            id:{id:'blue'},routeShortName:'Blue',routeLongName:'Parnassus - SFGH - Mission Bay - Mt. Zion'
          }
        };
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp/routers/default/index/routes/ucsf%3Ablue/stops?detail=true&refs=true')
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

    it('should return an empty array for stops if JSON is borked', function (done) {
      revert = shuttle.__set__('logger', function () {});

      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {stops: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/stops')
      .reply(200, '{');

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

    it('should log and return an error if there is an http error event', function (done) {
      var logged = false;
      revert = shuttle.__set__('logger', function (message) {
        expect(message.slice(0, 21)).to.equal('shuttle/stops error: ');
        expect(message.length).to.be.greaterThan(20);
        logged = true;
      });

      var mockReq = {query: {routeId: 'fhqwhgads'}};
      var mockRes = {json: function (data) {
        expect(typeof data.error).to.equal('string');
        expect(data.error.length).to.be.greaterThan(5);
        expect(logged).to.equal(true);
        done();
      }};

      shuttle.stops(mockReq, mockRes);
    });

    it('should handle "va" correctly', function (done) {
      var mockReq = {query: {routeId: 'va'}};
      var mockRes = {json: function (data) {
        var expectedResults = {
          stops:[{
            id:{id:'parlppi', agencyId:'ucsf'},
            stopName:'401 Parnassus (LPPI)',
            stopLat:37.7638174033811,
            stopLon:-122.45648592710495,
            parentStation:'Parnassus'
          },{
            id:{id:'veteran', agencyId:'ucsf'},
            stopName:'VA Medical Center',
            stopLat:37.782019,
            stopLon:-122.504996
          }],
          route:{
            id:{id:'va'},
            routeShortName:'VA',
            routeLongName:'VAMC - Parnassus'
          }
        };
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/routes/ucsf%3Ava/stops?detail=true&refs=true')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsVa.json');

      shuttle.stops(mockReq, mockRes);
    });

    it('should return an empty routeLongName if GTFS not yet loaded', function (done) {
      revert = shuttle.__set__('transit', {agencies: {}});

      var mockReq = {query: {routeId: 'va'}};
      var mockRes = {json: function (data) {
        var expectedResults = {
          stops:[{
            id:{id:'parlppi', agencyId:'ucsf'},
            stopName:'401 Parnassus (LPPI)',
            stopLat:37.7638174033811,
            stopLon:-122.45648592710495,
            parentStation:'Parnassus'
          },{
            id:{id:'veteran', agencyId:'ucsf'},
            stopName:'VA Medical Center',
            stopLat:37.782019,
            stopLon:-122.504996
          }],
          route:{
            id:{id:'va'},
            routeShortName:'VA',
            routeLongName:''
          }
        };
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/routes/ucsf%3Ava/stops?detail=true&refs=true')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsVa.json');

      shuttle.stops(mockReq, mockRes);      
    });

    it('should remove ACC and Library from Bronze results', function (done) {
      var mockReq = {query: {routeId: 'bronze'}};
      var mockRes = {json: function (data) {
        var expectedResults = {
          stops:[
            {
              id:{id:'parlppi',agencyId:'ucsf'},
              stopName:'401 Parnassus (LPPI)',
              stopLat:37.7638174033811,
              stopLon:-122.45648592710495,
              parentStation:'Parnassus'
            },{
              id:{id:'surgedown',agencyId:'ucsf'},
              stopName:'Surge/Woods',
              stopLat:37.760757,
              stopLon:-122.456163,
            },{
              id:{id:'75behr',agencyId:'ucsf'},
              stopName:'Aldea Housing',
              stopLat:37.758793,
              stopLon:-122.454181,
            }
          ],
          route:{
            id:{id:'bronze'},
            routeShortName:'Bronze',
            routeLongName:'Aldea - ACC - Library - 6th - Dental - LPPI'
          }
        };
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
      .get('/otp/routers/default/index/routes/ucsf%3Abronze/stops?detail=true&refs=true')
      .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsBronze.json');

      shuttle.stops(mockReq, mockRes);
    });
  });

  describe('predictions()', function () {
    it('should return pre-populated predictions for specified route/stop', function (done) {
      revert = shuttle.__set__('predictions', {
        timestamp: Date.now(),
        predictions: [{routeId: 'blue', stopId: 'sfgh', times: [0, 1, 2]}]
      });

      var mockReq = {query: {routeId: 'blue', stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: [0, 1, 2]};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      shuttle.predictions(mockReq, mockRes);
    });

    it('should return predictions for specified route/stop', function (done) {
      var mockReq = {query: {routeId: 'blue', stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: ['8', '15', '23', '51', '71']};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://webservices.nextbus.com:80')
      .get('/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf&stops=grey%7Cmissb4we&stops=grey%7Cparlppi&stops=grey%7Chospital&stops=blue%7Cmissb4we&stops=blue%7Chospital&stops=blue%7Cparlppi&stops=blue%7Cmtzion&stops=blue%7Csfgh&stops=gold%7Cmissb4we&stops=gold%7Chospital&stops=gold%7Csfgh&stops=gold%7Cparlppi&stops=gold%7Cmtzion&stops=bronze%7C75behr&stops=bronze%7Cparlppi&stops=bronze%7Csurgedown&stops=black%7Clhts&stops=black%7Cmtzion&stops=black%7Clibrary&stops=tan%7Clhts&stops=tan%7Cmtzion&stops=tan%7Clibrary&stops=lime%7Clibrary&stops=lime%7Cmcb&stops=lime%7Cbuchaneb&stops=lime%7Cbuchanwb')
      .replyWithFile(200, __dirname + '/../fixtures/nextbus.xml');

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });

    it('should return an empty result if no route specified', function (done) {
      revert = shuttle.__set__('predictions', {
        timestamp: Date.now(),
        predictions: [{routeId: 'blue', stopId: 'sfgh', times: [0, 1, 2]}]
      });

      var mockReq = {query: {stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      shuttle.predictions(mockReq, mockRes);
    });

    it('should return an empty result if no route or stop specified', function (done) {
      revert = shuttle.__set__('predictions', {
        timestamp: Date.now(),
        predictions: [{routeId: 'blue', stopId: 'sfgh', times: [0, 1, 2]}]
      });

      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      shuttle.predictions(mockReq, mockRes);
    });    

    it('should return empty results if there are no predictions in XML', function (done) {
      var mockReq = {query: {routeId: 'blue', stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://webservices.nextbus.com:80')
      .get('/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf&stops=grey%7Cmissb4we&stops=grey%7Cparlppi&stops=grey%7Chospital&stops=blue%7Cmissb4we&stops=blue%7Chospital&stops=blue%7Cparlppi&stops=blue%7Cmtzion&stops=blue%7Csfgh&stops=gold%7Cmissb4we&stops=gold%7Chospital&stops=gold%7Csfgh&stops=gold%7Cparlppi&stops=gold%7Cmtzion&stops=bronze%7C75behr&stops=bronze%7Cparlppi&stops=bronze%7Csurgedown&stops=black%7Clhts&stops=black%7Cmtzion&stops=black%7Clibrary&stops=tan%7Clhts&stops=tan%7Cmtzion&stops=tan%7Clibrary&stops=lime%7Clibrary&stops=lime%7Cmcb&stops=lime%7Cbuchaneb&stops=lime%7Cbuchanwb')
      .replyWithFile(200, __dirname + '/../fixtures/nextbusNoPredictions.xml');

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });

    it('should return empty result if there is no body in XML', function (done) {
      var mockReq = {query: {routeId: 'blue', stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://webservices.nextbus.com:80')
      .get('/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf&stops=grey%7Cmissb4we&stops=grey%7Cparlppi&stops=grey%7Chospital&stops=blue%7Cmissb4we&stops=blue%7Chospital&stops=blue%7Cparlppi&stops=blue%7Cmtzion&stops=blue%7Csfgh&stops=gold%7Cmissb4we&stops=gold%7Chospital&stops=gold%7Csfgh&stops=gold%7Cparlppi&stops=gold%7Cmtzion&stops=bronze%7C75behr&stops=bronze%7Cparlppi&stops=bronze%7Csurgedown&stops=black%7Clhts&stops=black%7Cmtzion&stops=black%7Clibrary&stops=tan%7Clhts&stops=tan%7Cmtzion&stops=tan%7Clibrary&stops=lime%7Clibrary&stops=lime%7Cmcb&stops=lime%7Cbuchaneb&stops=lime%7Cbuchanwb')
      .replyWithFile(200, __dirname + '/../fixtures/nextbusNoBody.xml');

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });

    it('should return empty result if XML parser returns non-object', function (done) {
      revert = shuttle.__set__('xml2js', {
        Parser: function () {
          this.parseString = function () {};
          this.on = function (event, handler) {
            if (event === 'end') {
              process.nextTick(handler);
            }
          };
        }
      });

      var mockReq = {query: {routeId: 'lime', stopId: 'mcb'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://webservices.nextbus.com:80')
      .get('/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf&stops=grey%7Cmissb4we&stops=grey%7Cparlppi&stops=grey%7Chospital&stops=blue%7Cmissb4we&stops=blue%7Chospital&stops=blue%7Cparlppi&stops=blue%7Cmtzion&stops=blue%7Csfgh&stops=gold%7Cmissb4we&stops=gold%7Chospital&stops=gold%7Csfgh&stops=gold%7Cparlppi&stops=gold%7Cmtzion&stops=bronze%7C75behr&stops=bronze%7Cparlppi&stops=bronze%7Csurgedown&stops=black%7Clhts&stops=black%7Cmtzion&stops=black%7Clibrary&stops=tan%7Clhts&stops=tan%7Cmtzion&stops=tan%7Clibrary&stops=lime%7Clibrary&stops=lime%7Cmcb&stops=lime%7Cbuchaneb&stops=lime%7Cbuchanwb')
      .replyWithFile(200, __dirname + '/../fixtures/nextbusNoPredictions.xml');

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });

    it('should omit predictions if minutes property is missing', function (done) {
      var mockReq = {query: {routeId: 'blue', stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: ['8', '51', '71']};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://webservices.nextbus.com:80')
      .get('/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf&stops=grey%7Cmissb4we&stops=grey%7Cparlppi&stops=grey%7Chospital&stops=blue%7Cmissb4we&stops=blue%7Chospital&stops=blue%7Cparlppi&stops=blue%7Cmtzion&stops=blue%7Csfgh&stops=gold%7Cmissb4we&stops=gold%7Chospital&stops=gold%7Csfgh&stops=gold%7Cparlppi&stops=gold%7Cmtzion&stops=bronze%7C75behr&stops=bronze%7Cparlppi&stops=bronze%7Csurgedown&stops=black%7Clhts&stops=black%7Cmtzion&stops=black%7Clibrary&stops=tan%7Clhts&stops=tan%7Cmtzion&stops=tan%7Clibrary&stops=lime%7Clibrary&stops=lime%7Cmcb&stops=lime%7Cbuchaneb&stops=lime%7Cbuchanwb')
      .replyWithFile(200, __dirname + '/../fixtures/nextbusSlightlyBorkedMinutes.xml');

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });

    it('should deal with absence of $ property etc. gracefully', function (done) {
      revert = shuttle.__set__('xml2js', {
        Parser: function () {
          this.parseString = function () {};
          this.on = function (event, handler) {
            if (event === 'end') {
              process.nextTick(handler.bind(null, {body: {predictions: [
                {},
                {'$': {}},
                {'$': {}, direction: []},
                {'$': {}, direction: [{}]}
              ]}}));
            }
          };
        }
      });

      var mockReq = {query: {routeId: 'black', stopId: 'lhts'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://webservices.nextbus.com:80')
      .get('/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf&stops=grey%7Cmissb4we&stops=grey%7Cparlppi&stops=grey%7Chospital&stops=blue%7Cmissb4we&stops=blue%7Chospital&stops=blue%7Cparlppi&stops=blue%7Cmtzion&stops=blue%7Csfgh&stops=gold%7Cmissb4we&stops=gold%7Chospital&stops=gold%7Csfgh&stops=gold%7Cparlppi&stops=gold%7Cmtzion&stops=bronze%7C75behr&stops=bronze%7Cparlppi&stops=bronze%7Csurgedown&stops=black%7Clhts&stops=black%7Cmtzion&stops=black%7Clibrary&stops=tan%7Clhts&stops=tan%7Cmtzion&stops=tan%7Clibrary&stops=lime%7Clibrary&stops=lime%7Cmcb&stops=lime%7Cbuchaneb&stops=lime%7Cbuchanwb')
      .replyWithFile(200, __dirname + '/../fixtures/nextbusNoPredictions.xml');

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });

    it('should handle error getting NextBus gracefully', function (done) {
      revert = shuttle.__set__('logger', function () {});

      var mockReq = {query: {routeId: 'blue', stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });

    it('should handle http error getting NextBus gracefully', function (done) {
      revert = shuttle.__set__('logger', function () {});

      var mockReq = {query: {routeId: 'blue', stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://webservices.nextbus.com:80')
      .get('/service/publicXMLFeed?command=predictionsForMultiStops&a=ucsf&stops=grey%7Cmissb4we&stops=grey%7Cparlppi&stops=grey%7Chospital&stops=blue%7Cmissb4we&stops=blue%7Chospital&stops=blue%7Cparlppi&stops=blue%7Cmtzion&stops=blue%7Csfgh&stops=gold%7Cmissb4we&stops=gold%7Chospital&stops=gold%7Csfgh&stops=gold%7Cparlppi&stops=gold%7Cmtzion&stops=bronze%7C75behr&stops=bronze%7Cparlppi&stops=bronze%7Csurgedown&stops=black%7Clhts&stops=black%7Cmtzion&stops=black%7Clibrary&stops=tan%7Clhts&stops=tan%7Cmtzion&stops=tan%7Clibrary&stops=lime%7Clibrary&stops=lime%7Cmcb&stops=lime%7Cbuchaneb&stops=lime%7Cbuchanwb')
      .reply(500, 'server error');

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });

    it('should handle http response error getting NextBus gracefully', function (done) {
      var resp = eventEmitter;
      revert = shuttle.__set__({
        http: {
          'get': function (options, cb) { 
            process.nextTick(function () {cb(resp);});
            setImmediate(function() {resp.emit('error');});
            return {on: function () {}};
          }
        },
        logger: function () {}
      });

      var mockReq = {query: {routeId: 'blue', stopId: 'sfgh'}};
      var mockRes = {json: function (data) {
        var expectedResults = {times: []};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      shuttle.clearPredictions();
      shuttle.predictions(mockReq, mockRes);
    });
  });

  describe('plan()', function () {
    it('should return plans for typical requests', function (done) {
      var mockReq = {query: {
        fromPlace: 'ucsf_mtzion',
        toPlace: 'ucsf_sfgh',
        arriveBy: 'false',
        time: '8:45 AM',
        date: '1/20/2016'
      }};
      var mockRes = {json: function (data) {
        expect(data.plan.date).to.equal(1453221900000);
        expect(data.plan.from).to.deep.equal({
          name: 'Mt. Zion',
          lon: -122.439474016428,
          lat: 37.78524781704753,
          orig: '',
          vertexType: 'NORMAL'
        });
        expect(data.plan.to).to.deep.equal({
          name: 'SFGH',
          lon: -122.40492649376392,
          lat: 37.7548539352877,
          orig: '',
          vertexType: 'NORMAL'
        });
        expect(data.plan.itineraries.length).to.equal(3);
        expect(data.plan.itineraries[0]).to.deep.include({
          duration: 2760000,
          startTime: 1453222080000,
          endTime: 1453224840000,  
          transitTime: 2760
        });
        expect(data.plan.itineraries[0].legs.length).to.equal(1);
        expect(data.plan.itineraries[0].legs[0]).to.deep.include({
          startTime: 1453222080000,
          endTime: 1453224840000,
          mode: 'BUS',
          route: 'Blue',
          routeId: 'blue',
          tripId: 'blue_c',
          serviceDate: '20160119',
          routeShortName: 'Blue',
          duration: 2760000
        });
        expect(data.plan.itineraries[0].legs[0].from).to.deep.include({
          name: 'Mt. Zion',
        });
        expect(data.plan.itineraries[0].legs[0].to).to.deep.include({
          name: 'SFGH'
        });

        done();
      }};

      nock('http://localhost:8080')
      .get('/otp/routers/default/plan?minTransferTime=60&date=1%2F20%2F2016&time=8%3A45%20AM&arriveBy=false&fromPlace=ucsf%3Amtzion&toPlace=ucsf%3Asfgh&mode=TRANSIT%2CWALK')
      .replyWithFile(200, __dirname + '/../fixtures/shuttlePlan.json');

      shuttle.plan(mockReq, mockRes);
    });

    it('should return results that are sorted', function (done) {
      var mockReq = {
        query: {
          fromPlace: 'ucsf_lhts',
          toPlace: 'ucsf_sfgh',
          arriveBy: 'false',
          time: '1:00 PM',
          date: '1/19/2016'
        }
      };

      var mockRes = {
        json: function (data) {
          expect(data.plan.itineraries.every(function(current, index, array) {
            if (index === array.length - 1) {
              return true;
            }
            var next = array[index +1];
            return (current.startTime <= next.startTime) ||
              ((current.startTime >= next.startTime) && (current.endTime <= next.endTime));
          })).to.be.true();
          done();
        }
      };

      nock('http://localhost:8080')
      .get('/otp/routers/default/plan?minTransferTime=60&date=1%2F19%2F2016&time=1%3A00%20PM&arriveBy=false&fromPlace=ucsf%3Alhts&toPlace=ucsf%3Asfgh&mode=TRANSIT%2CWALK')
      .replyWithFile(200, __dirname + '/../fixtures/shuttlePlanSort.json');

      shuttle.plan(mockReq, mockRes);
    });

    it('should omit initial "walk to" step', function (done) {
      var mockReq = {
        query: {
          fromPlace: 'ucsf_Parnassus',
          toPlace: 'ucsf_sfgh',
          arriveBy: 'true',
          time: '2:15 PM',
          date: '1/19/2016'
        }
      };
      var mockRes = {
        json: function (data) {
          expect(data.plan.itineraries.every(function (itinerary) {
            return itinerary.legs[0].mode === 'BUS';
          })).to.be.true();
          done();
        }
      };

      nock('http://localhost:8080')
      .get('/otp/routers/default/plan?minTransferTime=60&date=1%2F19%2F2016&time=2%3A15%20PM&arriveBy=true&fromPlace=37.763174%2C-122.459176&toPlace=ucsf%3Asfgh&mode=TRANSIT%2CWALK')
      .replyWithFile(200, __dirname + '/../fixtures/shuttlePlanStartWithWalk.json');

      shuttle.plan(mockReq, mockRes);
    });

    it('should return an empty object if no query', function (done) {
      revert = shuttle.__set__('logger', function () {});

      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
      .get('/otp/routers/default/plan?minTransferTime=60&fromPlace=ucsf%3Aundefined&toPlace=ucsf%3Aundefined&mode=TRANSIT%2CWALK')
      .replyWithFile(200, __dirname + '/../fixtures/shuttlePlanEmpty.json');

      shuttle.plan(mockReq, mockRes);      
    });

    it('should return an error property if there is an http error event', function (done) {
      revert = shuttle.__set__('logger', function () {});

      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        expect(data.error).to.exist();
        done();
      }};

      shuttle.plan(mockReq, mockRes);      
    });

    it('should return an error if HTTP status code is not 200', function (done) {
      revert = shuttle.__set__('logger', function () {});

      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        expect(data.error).to.exist();
        done();
      }};

      nock('http://localhost:8080')
      .get('/otp/routers/default/plan?minTransferTime=60&fromPlace=ucsf%3Aundefined&toPlace=ucsf%3Aundefined&mode=TRANSIT%2CWALK')
      .reply(500);

      shuttle.plan(mockReq, mockRes);       
    });

    it('should return an empty plan if JSON is borked', function (done) {
      revert = shuttle.__set__('logger', function () {});

      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        expect(data).to.deep.equal({});
        done();
      }};

      nock('http://localhost:8080')
      .get('/otp/routers/default/plan?minTransferTime=60&fromPlace=ucsf%3Aundefined&toPlace=ucsf%3Aundefined&mode=TRANSIT%2CWALK')
      .reply(200, '{');

      shuttle.plan(mockReq, mockRes);  
    });
  });
});

