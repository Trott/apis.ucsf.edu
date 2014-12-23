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
    it('should return a static result', function (done) {
      var mockReq = {query: {}};
      var mockRes = {json: function (data) {
        var expectedResults = {
          stops: [{}],
          routeLongName: 'Holiday Schedule: Please refer to http://tiny.ucsf.edu/ShuttleAlerts'
        };
        expect(data).to.deep.equal(expectedResults);
        done();
      }};

      shuttle.stops(mockReq, mockRes);
    });
  });
});

