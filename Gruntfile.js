module.exports = function (grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            baseView: {
                options : {
                    banner: '//     Backbone.BaseView <%= pkg.version %>\n//     (c) 2014 James Ballantine, 1stdibs.com Inc.\n//     Backbone.BaseView may be freely distributed under the MIT license.\n//     For all details and documentation:\n//     https://github.com/1stdibs/backbone-base-and-form-view\n'
                },
                files : {
                    'backbone-baseview.min.js' : ['backbone-baseview.js']
                }
            },
            formView: {
                options: {
                    banner: '//     Backbone.FormView <%= pkg.version %>\n//     (c) 2014 James Ballantine, 1stdibs.com Inc.\n//     Backbone.FormView may be freely distributed under the MIT license.\n//     For all details and documentation:\n//     https://github.com/1stdibs/backbone-base-and-form-view\n'
                },
                files : {
                    'backbone-formview.min.js' : ['backbone-formview.js']
                }
            }
        },
        jasmine: {
            "backbone-base-and-form-view": {
                src: [
                    'backbone-baseview.js',
                    'backbone-formview.js'
                ],
                options: {
                    vendor: [
                        'test/vendor/jquery-1.10.2.min.js',
                        'test/vendor/underscore-min.js',
                        'test/vendor/backbone-min.js'
                    ],
                    specs: 'test/spec/*Spec.js',
                    outfile: 'test/_SpecRunner.html',
                    keepRunner : true
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Load the plugin that provides the "jasmine" task.
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    // Default task(s).
    grunt.registerTask('default', ['jasmine', 'uglify']);

};
