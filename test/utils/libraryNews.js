/*jshint expr: true*/

var libraryNews = require('../../utils/libraryNews.js');

var Code = require('code'); 
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;

var beforeEach = lab.beforeEach;

var nock = require('nock');


describe('exports', function () {
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
});