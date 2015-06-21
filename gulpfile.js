'use strict';

// include gulp and tools
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src([
      'app/**/*.js',
      '!app/doc/**/*'
    ])
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

// Generate documentation

// Build code (to dist, replace stuff in html examples, build doc)

// Serve code
gulp.task('serve', function(){
  //serve files from app directory
  browserSync({
        server: {
            baseDir: ['.tmp', 'app'],
            routes:{
                '/bower_components': 'bower_components'
            }
        }
    });

    gulp.watch(['app/**/*.js'], ['jshint', reload]);
});

// Serve built code