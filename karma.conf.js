'use strict';

module.exports = function(karma) {
  karma.set({

    // frameworks to use
    frameworks: ['jasmine', 'browserify'],

    // list of files / patterns to load in the browser
    files: [
      'app/**/*.test.js',
      {pattern: 'app/data/**/*.dcm', included: false, watched: false, served: true}
    ],

    reporters: ['spec'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'app/**/*.test.js': ['browserify']
    },

    browsers: ['PhantomJS', 'Chrome'],

    // web server port
    // port: 9876,
    // colors: true,
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: 'LOG_WARN',

    autoWatch: false,
    singleRun: true,


    browserify: {
      debug: true,
      transform: [ 'glslify', 'babelify' ]
    },
  });
};
