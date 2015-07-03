'use strict';

// include gulp and tools
var gulp = require('gulp');
var gulpif = require('gulp-if');
var $ = require('gulp-load-plugins')();
var exec = require('child_process').exec;
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var del = require('del');
var runSequence = require('run-sequence');
var es = require('event-stream');
var browserify = require('browserify');
var babel = require('gulp-babel');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var glslify = require('glslify');
var uglify = require('gulp-uglify');
var globby = require('globby');
var minimist = require('minimist');
var karma = require('karma');

// parse gulp input to know if we are in dev mode or not
var knownOptions = {
  string: 'env',
  default: {env: process.env.NODE_ENV || 'production'}
};
var options = minimist(process.argv.slice(2), knownOptions);

// Clean output directories
gulp.task('clean', del.bind(null, ['dist', '.tmp']));

// HTML task
gulp.task('html', function() {
  return gulp.src([
        'app/**/*.html',
        '!app/deprecated{,/**}',
        '!app/daikon{,/**}'
    ])
    .pipe(gulpif(options.env === 'production', $.replace('bower_components', 'libs')))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// CSS task
gulp.task('css', function() {
  return gulp.src([
        'app/**/*.css',
        '!app/deprecated{,/**}',
        '!app/daikon{,/**}'
    ])
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'css'}));
});

// Javascript task browserify and babelify
gulp.task('javascript', function(cb) {
  // process files of interest
  globby(['app/app.js', 'app/examples/**/*.js'], function(err, files) {
    if (err) {
      cb(err);
    }

    var tasks = files.map(function(entry) {
          // to remove /app layer
          var index = entry.indexOf('/');
          return browserify(
              {entries: [entry],
                debug: true,
                // could add babelify there...
                transform: [glslify]
              })
            .bundle()
            .pipe(source(entry.substring(index + 1)))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(babel())
                .pipe(gulpif(options.env === 'production', uglify()))
                .on('error', gutil.log)
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('dist')); 
        });

    // create a merged stream
    es.merge(tasks).on('end', cb);
  });
});

// Generate documentation
function runJSDoc(done) {
  var cmd = '';
  if (process.platform === 'win32') {
    cmd = 'node_modules\\.bin\\jsdoc -r -c jsdoc.conf -t node_modules\\jsdoc-baseline -d dist\\doc app';
  }else {
    cmd = 'node_modules/.bin/jsdoc -r -c jsdoc.conf -t node_modules/jsdoc-baseline -d dist/doc app';
  }
  exec(cmd, function(e, stdout) {
    gutil.log(stdout);
    done();
  });
}

gulp.task('doc', function(done) {
  if (options.env === 'production') {
    runJSDoc(done);
  } else {
    done();
  }
});

// Run tests
gulp.task('test', function(cb) {
  karma.server.start({
    configFile: __dirname + '/karma.conf.js',
    reporters: ['spec'],
    singleRun: true
  }, function(e, stdout) {
    // ignore errors, we don't want to fail the build
    // karma server will print all test failures
    //gutil.log(stdout);
    cb();
  });
});

// Copy task
gulp.task('copy', function() {
  // we could probably grab that from html files...
  var threejs = gulp.src([
    'bower_components/threejs/build/three.min.js'
  ]).pipe(gulpif(options.env === 'production', gulp.dest('dist/libs/threejs/build')));

  var stats = gulp.src([
    'bower_components/threejs/examples/js/libs/stats.min.js'
  ]).pipe(gulpif(options.env === 'production', gulp.dest('dist/libs/threejs/examples/js/libs')));

  var datgui = gulp.src([
    'bower_components/dat.gui/build/dat.gui.min.js'
  ]).pipe(gulpif(options.env === 'production', gulp.dest('dist/libs/dat.gui/build')));

  var dcmjs = gulp.src([
    'bower_components/dcmjs.org/javascripts/**/*.js'
  ]).pipe(gulpif(options.env === 'production', gulp.dest('dist/libs/dcmjs.org/javascripts')));

  var dicomParser = gulp.src([
    'bower_components/dicomParser/dist/dicomParser.min.js'
  ]).pipe(gulpif(options.env === 'production', gulp.dest('dist/libs/dicomParser/dist')));

  return es.merge(threejs, stats, datgui, dcmjs, dicomParser)
    .pipe($.size({title: 'copy'}));
});

// Lint JavaScript
gulp.task('jshint', function() {
  return gulp.src([
      'app/**/*.js',
      '!app/daikon{,/**}'
    ])
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('js-watch', ['copy', 'doc', 'jshint', 'javascript', 'test'], reload);
gulp.task('html-watch', ['html'], reload);
gulp.task('css-watch', ['css'], reload);

// Serve code from Ecma Script Today directory
gulp.task('serve', ['default'], function() {
  // dist mode, no route to web components
  browserSync({
    server: {
      baseDir: ['dist'],
      routes:{
        '/bower_components': 'bower_components',
        '/data': 'app/data'
      }
    }
  });

  // js need to go through browserify/babelify/glslify to .tmp and be loaded from there!
  gulp.watch(['app/**/*.js'], ['js-watch']);
  gulp.watch(['app/**/*.html'], ['html-watch']);
  gulp.watch(['app/**/*.css'], ['html-css']);
});

// Build production files, the default task
gulp.task('default', ['clean'], function(cb) {
  runSequence(
    'copy',
    ['javascript', 'html', 'css'],
   'doc',
   'test',
    cb);
});
