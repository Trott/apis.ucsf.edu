/*global module:false*/
module.exports = function (grunt) {
    'use strict';

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
                predef: ['XDomainRequest', 'flensed', 'UCSF'],
                boss: true,
                eqnull: true,
                browser: true
            },
            jsFragments: ['js_fragments/*.src']
        },
        uglify: {
            static: {
                files: {
                    'js_fragments/base': ['js_fragments/base.src'],
                    'js_fragments/person': ['js_fragments/person.src'],
                    'js_fragments/shuttle': ['js_fragments/shuttle.src'],
                    'js_fragments/library': ['js_fragments/library.src'],
                }
            }
        },
        cssmin: {
            static: {
                expand: true,
                cwd: 'static/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'static/css/',
                ext: '.min.css'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['jshint:jsFragments', 'uglify:static', 'cssmin:static']);
};
