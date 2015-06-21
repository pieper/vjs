'use strict';

// include gulp and tools
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var del = require('del');
var runSequence = require('run-sequence');
var merge = require('merge-stream');

// Clean output directories
gulp.task('clean', del.bind(null, 'dist'));

// Copy task
gulp.task('copy', function () {
  var app = gulp.src([
    'app/**/*',
    '!app/deprecated{,/**}'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));

  var threejs = gulp.src([
    'bower_components/threejs/build/three.min.js'
  ]).pipe(gulp.dest('dist/libs/threejs/build'));

  var stats = gulp.src([
    'bower_components/threejs/examples/js/libs/stats.min.js'
  ]).pipe(gulp.dest('dist/libs/threejs/examples/js/libs'));

  var datgui = gulp.src([
    'bower_components/dat.gui/build/dat.gui.min.js'
  ]).pipe(gulp.dest('dist/libs/dat.gui/build'));

  var dcmjs = gulp.src([
    'bower_components/dcmjs.org/javascripts/**/*.js'
  ]).pipe(gulp.dest('dist/libs/dcmjs.org/javascripts'));

  return merge(app, threejs, stats, datgui, dcmjs)
    .pipe($.size({title: 'copy'}));
});

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src([
      'app/**/*.js'
    ])
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

// Parse HTML assets and optimize it
gulp.task('html', function () {
  // var assets = $.useref.assets({searchPath: ['.tmp', 'app', 'dist']});

  return gulp.src([
        'app/**/*.html',
        '!app/deprecated{,/**}'
    ])
    // Replace path for vulcanized assets
    .pipe($.if('*.html', $.replace('bower_components', 'libs')))
    // .pipe(assets)
    // // Concatenate And Minify JavaScript
    // .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
    // // Concatenate And Minify Styles
    // // In case you are still using useref build blocks
    // .pipe($.if('*.css', $.cssmin()))
    // .pipe(assets.restore())
    // .pipe($.useref())
    // Minify Any HTML
    .pipe($.if('*.html', $.minifyHtml({
      quotes: true,
      empty: true,
      spare: true
    })))
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Generate documentation
gulp.task('doc', function(){
    gulp.src('')
    .pipe($.shell([
      './node_modules/.bin/jsdoc -r -c jsdoc.conf -t ./node_modules/jsdoc-baseline -d dist/doc app/'
    ]))
    .pipe($.size({title: 'doc'}));
});

// Serve code
gulp.task('serve', function(){
  browserSync({
        server: {
            baseDir: 'app',
            routes:{
                '/bower_components': 'bower_components'
            }
        }
    });

    gulp.watch(['app/**/*.js'], ['jshint', reload]);
    gulp.watch(['app/**/*.html', 'app/**/*.css'], reload);
});

// Serve built code
gulp.task('serve:dist', ['default'], function(){
  browserSync({
        server: {
            baseDir: ['dist']
        }
    });
});

// Build production files, the default task
gulp.task('default', ['clean'], function (cb) {
  runSequence(
    'copy',
    ['jshint','html'],
    'doc',
    cb);
});