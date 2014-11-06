/*jshint expr: true*/

var rewire = require('rewire');

var events = require('events');
var eventEmitter = new events.EventEmitter();

var nock = require('nock');

nock('http://api.libcal.com:80')
  .get('/api_hours_grid.php?iid=138&format=json&weeks=2')
  .replyWithFile(200, __dirname + '/../fixtures/hours.json');

nock('http://lgapi.libapps.com:80')
  .get('/1.0/guides/100978,100985,100999,100992,100980,100974,100998,100991,100979,100984,100994,13690,100988,101010,100986,101021,100983,100966,100975,100967,101006,100971,101002,100996?site_id=407')
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
  beforeEach(function (done) {
    eventEmitter.removeAllListeners();
    nock.disableNetConnect();
    done();
  });

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
        expect(value[0].name).to.equal('sfx');
        expect(value[0].data.length).to.equal(2);
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

      var noop = function () {
      };

      var mockEnd = function () {
        done();
      };

      library.search({query: {q: 'medicine', c: ['sfx'], async: ''}}, {writeHead: mockWriteHead, write: noop, flush: noop, end: mockEnd});
    });

    it('should allow searching for UCSF Library databases', function (done) {
      nock('https://www.library.ucsf.edu:443')
        .get('/db?filter0=fhqwhagads&apage=&filter2=All')
        .reply('200', '<html></html>');

      var mockJson = function (value) {
        expect(value[0].name).to.equal('dbs');
        expect(value[0].data.length).to.equal(0);
        done();
      };

      library.search({query: {q: 'fhqwhagads', c: ['dbs']}}, {json: mockJson});
    });

    it('should log an error if there is an error', function (done) {
      var revert = library.__set__('logger', function (value) {
        expect(value).to.equal('library/search error: Nock: Not allow net connect for "www.library.ucsf.edu:443"');
        eventEmitter.emit('errorLogged');
      });

      eventEmitter.on('errorLogged', function () {
        revert();
        done();
      });

      library.search({query: {q: 'fhqwhagads', c: ['dbs']}});
    });

    it('should log a default error message if one is not provided', function (done) {
      var revert = library.__set__({
        logger: function (value) {
          expect(value).to.equal('library/search error: unknown error');
          eventEmitter.emit('unknownErrorLogged');
        },
        amalgamatic: {
          search: function (options, callback) {
            callback({errorCode: 1});
          }
        }
      });

      eventEmitter.on('unknownErrorLogged', function () {
        revert();
        done();
      });

      library.search({query: {q: 'fhqwhagads', c: ['dbs']}});
    });

    it('should convert PubMed links to EZproxy for synchronous callback', function (done) {
      nock('http://eutils.ncbi.nlm.nih.gov')
        .get('/entrez/eutils/esearch.fcgi?retmode=json&term=medicine')
        .reply(200, '{"esearchresult": {"count": "2","retmax": "2","retstart": "0","idlist": ["25230398","25230381"]}}');

      nock('http://eutils.ncbi.nlm.nih.gov')
        .get('/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=25230398%2C25230381')
        .reply(200, '{"result": {"uids": ["25230398","25230381"], "25230398": {"title": "Medicine 1"}, "25230381": {"title": "Medicine 2"}}}');

      var mockJson = function (value) {
        expect(value[0].url).to.equal('https://ucsf.idm.oclc.org/login?qurl=http%3A%2F%2Fwww.ncbi.nlm.nih.gov%2Fpubmed%3Ftool%3Dcdl%26otool%3Dcdlotool%26cmd%3Dsearch%26term%3Dmedicine');
        expect(value[0].data[0].url).to.equal('https://ucsf.idm.oclc.org/login?qurl=http%3A%2F%2Fwww.ncbi.nlm.nih.gov%2Fentrez%2Fquery.fcgi%3Fdb%3Dpubmed%26cmd%3DRetrieve%26dopt%3DAbstractPlus%26query_hl%3D2%26itool%3Dpubmed_docsum%26tool%3Dcdl%26otool%3Dcdlotool%26list_uids%3D25230398');
        expect(value[0].data[1].url).to.equal('https://ucsf.idm.oclc.org/login?qurl=http%3A%2F%2Fwww.ncbi.nlm.nih.gov%2Fentrez%2Fquery.fcgi%3Fdb%3Dpubmed%26cmd%3DRetrieve%26dopt%3DAbstractPlus%26query_hl%3D2%26itool%3Dpubmed_docsum%26tool%3Dcdl%26otool%3Dcdlotool%26list_uids%3D25230381');
        done();
      };

      library.search({query: {q: 'medicine', c: ['pubmed']}}, {json: mockJson});
    });
    
    it('should convert PubMed links to EZproxy for asynchronous callback', function (done) {
      nock('http://eutils.ncbi.nlm.nih.gov')
        .get('/entrez/eutils/esearch.fcgi?retmode=json&term=medicine')
        .reply(200, '{"esearchresult": {"count": "2","retmax": "2","retstart": "0","idlist": ["25230398","25230381"]}}');

      nock('http://eutils.ncbi.nlm.nih.gov')
        .get('/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=25230398%2C25230381')
        .reply(200, '{"result": {"uids": ["25230398","25230381"], "25230398": {"title": "Medicine 1"}, "25230381": {"title": "Medicine 2"}}}');

      var mockWrite = function (value) {
        if (value.substring(0,6) === 'data: ') {
          var data = JSON.parse(value.substring(6));
          expect(data.url).to.equal('https://ucsf.idm.oclc.org/login?qurl=http%3A%2F%2Fwww.ncbi.nlm.nih.gov%2Fpubmed%3Ftool%3Dcdl%26otool%3Dcdlotool%26cmd%3Dsearch%26term%3Dmedicine');
          expect(data.data[0].url).to.equal('https://ucsf.idm.oclc.org/login?qurl=http%3A%2F%2Fwww.ncbi.nlm.nih.gov%2Fentrez%2Fquery.fcgi%3Fdb%3Dpubmed%26cmd%3DRetrieve%26dopt%3DAbstractPlus%26query_hl%3D2%26itool%3Dpubmed_docsum%26tool%3Dcdl%26otool%3Dcdlotool%26list_uids%3D25230398');
          expect(data.data[1].url).to.equal('https://ucsf.idm.oclc.org/login?qurl=http%3A%2F%2Fwww.ncbi.nlm.nih.gov%2Fentrez%2Fquery.fcgi%3Fdb%3Dpubmed%26cmd%3DRetrieve%26dopt%3DAbstractPlus%26query_hl%3D2%26itool%3Dpubmed_docsum%26tool%3Dcdl%26otool%3Dcdlotool%26list_uids%3D25230381');
          done();
        }
      };

      library.search(
        {
          query: {q: 'medicine', c: ['pubmed'], async: ''}
        }, {
          write: mockWrite, 
          writeHead: function () {},
          flush: function () {},
          end: function () {}
        }
      );
    });

    it('should return empty results without throwing errors', function (done) {
      var mockJson = function (value) {
        expect(value.length).to.equal(1);
        expect(value[0].data).to.deep.equal([]);
        expect(value[0].suggestedTerms).to.deep.equal([]);
        expect(value[0].name).to.equal('pubmed');
        done();
      };
      library.search({query: {q: '', c: ['pubmed']}}, {json: mockJson});
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
        eventEmitter.emit('guidesCallback');
      };

      var guidesMock = {};

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

      nock('http://lgapi.libapps.com:80')
        .get('/1.0/guides/100978,100985,100999,100992,100980,100974,100998,100991,100979,100984,100994,13690,100988,101010,100986,101021,100983,100966,100975,100967,101006,100971,101002,100996?site_id=407')
        .reply(404, 'Not found');
      
      var guidesMock = {};
      var mockLogger = function (logMsg) {
        expect(logMsg).to.equal('updateGuidesAsync error: code 404');
        messageLogged = true;
        eventEmitter.emit('arewedoneyet');
      };
      var revert = library.__set__({guides: guidesMock, logger: mockLogger});

      var mockRes = {
        json: function (data) {
          expect(data).to.deep.equal({});
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

      nock('http://lgapi.libapps.com:80')
        .get('/1.0/guides/100978,100985,100999,100992,100980,100974,100998,100991,100979,100984,100994,13690,100988,101010,100986,101021,100983,100966,100975,100967,101006,100971,101002,100996?site_id=407')
        .reply(200, 'Invalid JSON');

      var guidesMock = {};
      var mockLogger = function (logMsg) {
        expect(logMsg).to.equal('error parsing LibGuides JSON: Unexpected token I');
        messageLogged = true;
        eventEmitter.emit('arewedoneyet');
      };
      var revert = library.__set__({guides: guidesMock, logger: mockLogger});

      var mockRes = {
        json: function (data) {
          expect(data).to.deep.equal({});
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

      var guidesMock = {};
      var mockLogger = function (logMsg) {
        expect(logMsg).to.equal('updateGuidesAsync error: Nock: Not allow net connect for "lgapi.libapps.com:80"');
        messageLogged = true;
        eventEmitter.emit('arewedoneyet');
      };
      var revert = library.__set__({guides: guidesMock, logger: mockLogger});

      var mockRes = {
        json: function (data) {
          expect(data).to.deep.equal({});
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
      var resMock = {
        json: function (value) {
          expect(value.locations.parnassus.length).to.equal(2);
          expect(value.error).to.be.undefined;
          revert();
          done();
        }
      };

      var revert = library.__set__('schedule', {get: returnScheduleJson});
      library.hours(null, resMock);
    });

    it('should fetch valid object if it does not already have one', function (done) {
      var revert = library.__set__('schedule', {
        get: function () {
          return {};
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

