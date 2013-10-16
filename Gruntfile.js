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
                predef: ['XDomainRequest', 'UCSF', 'Zepto'],
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
                    'js_fragments/free_food': ['js_fragments/free_food.src'],
                    'js_fragments/fitness': ['js_fragments/fitness.src'],
                    'js_fragments/library': ['js_fragments/library.src'],
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

    grunt.registerTask('default', ['jshint:jsFragments', 'uglify:static', 'compress:gtfs']);
};
