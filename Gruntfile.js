/*global module:false*/
module.exports = function (grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                globals: {UCSF: true},
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
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
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['jshint:jsFragments', 'uglify:static']);
};
