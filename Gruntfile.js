/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        predef: ['XDomainRequest','flensed'],
        boss: true,
        eqnull: true,
        browser: true
      },
      static: ['static/UCSF.Person.src.js']
    },
    uglify: {
      static: {
        files: {
          'static/UCSF.Person.js': ['static/UCSF.Person.src.js'],
          'static/UCSF.Shuttle.js': ['static/UCSF.Shuttle.src.js'],
          'static/ie7_polyfill.js': ['static/json2/json2.js','static/flensed/flXHR.js']
        }
      }
    },
    compress: {
      gtfs: {
        cwd: 'static/gtfs',
        expand: true,
        options: {
          archive: 'static/gtfs/latest.zip'
        },
        src: ['*.txt']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['jshint:static', 'uglify:static', 'compress:gtfs']);
};
