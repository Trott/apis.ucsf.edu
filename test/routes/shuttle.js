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
        var expectedResults = {'stops':[{'id':{'agencyId':'ucsf','id':'2300 Harrison'},'stopName':'20th & Alabama','stopLat':37.759072,'stopLon':-122.411562,'stopCode':null,'stopDesc':'20th & Alabama','zoneId':null,'stopUrl':null,'locationType':1,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'sfgh'},'stopName':'SFGH','stopLat':37.7548539352877,'stopLon':-122.40492649376392,'stopCode':null,'stopDesc':'San Francisco General Hospital (2557 23rd St.)','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'mtzion'},'stopName':'Mt. Zion','stopLat':37.78524781704753,'stopLon':-122.439474016428,'stopCode':null,'stopDesc':'Mt. Zion Medical Center (1600 Divisadero)','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'16thbart'},'stopName':'16th St. BART','stopLat':37.765128,'stopLon':-122.419402,'stopCode':null,'stopDesc':'16th St. BART Station','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'mcb'},'stopName':'Mission Center Building','stopLat':37.767326,'stopLon':-122.414519,'stopCode':null,'stopDesc':'Mission Center Building (1855 Folsom)','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'100 Buchanan'},'stopName':'Buchanan Dental Center','stopLat':37.770791,'stopLon':-122.426684,'stopCode':null,'stopDesc':'100 Buchanan','zoneId':null,'stopUrl':null,'locationType':1,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'654minn'},'stopName':'654 Minnesota','stopLat':37.761834,'stopLon':-122.390661,'stopCode':null,'stopDesc':'654 Minnesota','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'surgedown'},'stopName':'Surge/Woods','stopLat':37.760757,'stopLon':-122.456163,'stopCode':null,'stopDesc':'Surge/Woods','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'veteran'},'stopName':'VA Medical Center','stopLat':37.782019,'stopLon':-122.504996,'stopCode':null,'stopDesc':'4150 Clement','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'lhts'},'stopName':'Laurel Heights','stopLat':37.786592,'stopLon':-122.448552,'stopCode':null,'stopDesc':'Laurel Heights Building (3333 California)','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'Parnassus'},'stopName':'Parnassus Campus','stopLat':37.763174,'stopLon':-122.459176,'stopCode':null,'stopDesc':'Parnassus Ave.','zoneId':null,'stopUrl':null,'locationType':1,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'parkezar'},'stopName':'Kezar Lot','stopLat':37.767188,'stopLon':-122.453403,'stopCode':null,'stopDesc':'801 Stanyan','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'75behr'},'stopName':'Aldea Housing','stopLat':37.758793,'stopLon':-122.454181,'stopCode':null,'stopDesc':'75 Behr','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'3360 Geary'},'stopName':'3360 Geary','stopLat':37.78161,'stopLon':-122.455075,'stopCode':null,'stopDesc':'3360 Geary','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'MB'},'stopName':'Mission Bay Campus','stopLat':37.76793,'stopLon':-122.391009,'stopCode':null,'stopDesc':'4th St.','zoneId':null,'stopUrl':null,'locationType':1,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'chinbasn'},'stopName':'China Basin','stopLat':37.776594,'stopLon':-122.39223,'stopCode':null,'stopDesc':'China Basin','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'caltrain'},'stopName':'Caltrain','stopLat':37.7769459,'stopLon':-122.395165,'stopCode':null,'stopDesc':'Townsend at 4th','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null}]};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp-rest-servlet/ws/transit/stopsInRectangle?extended=true')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleStops.json');

      shuttle.stops(mockReq, mockRes);
    });

    it('should return just the blue stops if a routeId is specified', function (done) {
      var mockReq = {query: {routeId: 'blue'}};
      var mockRes = {json: function (data) {
        var expectedResults = {'stops':[{'id':{'agencyId':'ucsf','id':'parlppi'},'stopName':'401 Parnassus (LPPI)','stopLat':37.7638174033811,'stopLon':-122.45648592710495,'stopCode':null,'stopDesc':'401 Parnassus (Langley Porter)','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':'Parnassus','wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'mtzion'},'stopName':'Mt. Zion','stopLat':37.78524781704753,'stopLon':-122.439474016428,'stopCode':null,'stopDesc':'Mt. Zion Medical Center (1600 Divisadero)','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'missb4we'},'stopName':'Mission Bay (west side of street)','stopLat':37.76793,'stopLon':-122.391009,'stopCode':null,'stopDesc':'4th St. west side','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':'MB','wheelchairBoarding':0,'direction':null,'routes':null},{'id':{'agencyId':'ucsf','id':'sfgh'},'stopName':'SFGH','stopLat':37.7548539352877,'stopLon':-122.40492649376392,'stopCode':null,'stopDesc':'San Francisco General Hospital (2557 23rd St.)','zoneId':null,'stopUrl':null,'locationType':0,'parentStation':null,'wheelchairBoarding':0,'direction':null,'routes':null}],'route':{'id':{'agencyId':'ucsf','id':'blue'},'serviceId':null,'routeShortName':'Blue','routeLongName':'Parnassus - SFGH - Mission Bay - Mt. Zion','routeDesc':null,'routeUrl':null,'routeColor':null,'routeType':3,'routeTextColor':null,'routeBikesAllowed':null}};
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      nock('http://localhost:8080')
        .get('/otp-rest-servlet/ws/transit/routeData?agency=ucsf&references=true&extended=true&id=blue')
        .replyWithFile(200, __dirname + '/../fixtures/shuttleStopsBlue.json');

      shuttle.stops(mockReq, mockRes);  
    });

    it('should report an error if HTTP response code is not 200', function (done) {
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
        expect(value).to.equal('shuttle/stops error: code 404');
        eventEmitter.emit('errorLogged');
      });

      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {error: 'shuttle/stops error: code 404'};
        expect(data).to.deep.equal(expectedResults);
        eventEmitter.emit('errorSent');
      }};

      nock('http://localhost:8080')
        .get('/otp-rest-servlet/ws/transit/stopsInRectangle?extended=true')
        .reply(404, '404\'ed!');

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
        .get('/otp-rest-servlet/ws/transit/stopsInRectangle?extended=true')
        .replyWithFile(200, __dirname + '/../fixtures/borkedShuttleStops.json');

      shuttle.stops(mockReq, mockRes);  
    });
  });
});

