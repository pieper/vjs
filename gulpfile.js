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

//
var watchify = require('watchify');

// parse gulp input to know if we are in dev mode or not
var knownOptions = {
  string: 'env',
  default: {env: process.env.NODE_ENV || 'production'}
};
var options = minimist(process.argv.slice(2), knownOptions);

// Clean output directories
gulp.task('clean', del.bind(null, ['gh-pages', '.tmp']));

// Copy (data) task
// Copy task
gulp.task('copy', function() {
  var dcm = gulp.src(['data/dcm/**/*'])   // dicom data used in demos
    .pipe(gulp.dest('gh-pages/data/dcm'));

  var assets = gulp.src(['favicon.ico'])  // fav icon for github page
    .pipe(gulp.dest('gh-pages'));

  return es.merge(dcm, assets)
    .pipe($.size({title: 'copy'}));
});

// HTML task
gulp.task('html', function() {
  return gulp.src([
        '**/*.html',
        '!bower_components{,/**}',
        '!node_modules{,/**}',
        '!test{,/**}',
        '!gh-pages{,/**}',
        '!deprecated{,/**}'
    ])
    .pipe(gulp.dest('gh-pages'))
    .pipe($.size({title: 'html'}));
});

// CSS task
gulp.task('css', function() {
  return gulp.src([
        'examples/**/*.css'
    ])
    .pipe(gulp.dest('gh-pages/examples'))
    .pipe($.size({title: 'css'}));
});

// JS examples task
gulp.task('js-examples', function(cb) {
  // process files of interest
  globby(['examples/**/*.js'], function(err, files) {
    if (err) {
      cb(err);
    }
    var tasks = files.map(function(entry) {
          // to remove /app layer
          var index = entry.indexOf('/');
          return browserify(
              {entries: [entry],
                debug: true,
                transform: [glslify]
              })
            .bundle()
            .pipe(source(entry.substring(index + 1)))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(babel())
                .on('error', gutil.log)
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('gh-pages/examples')); 
        });

    // create a merged stream
    es.merge(tasks).on('end', cb);
  });
});

gulp.task('js-examples-watchify', function(cb) {
  // process files of interest
  globby(['examples/**/*.js'], function(err, files) {
    if (err) {
      cb(err);
    }
    var tasks = files.map(function(entry) {
      // to remove /app layer
      var index = entry.indexOf('/');
          
      var b = watchify(browserify(
        {entries: [entry],
          debug: true,
          // could add babelify there...
          transform: [glslify]
          }));

      b.on('update', bundle);
      b.on('log', gutil.log);

      function bundle() {
            return b.bundle()
            .pipe(source(entry.substring(index + 1)))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(babel())
                .on('error', gutil.log)
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('gh-pages/examples'))
            .pipe(reload({stream: true, once: true}));;
          }

      return bundle();
    });
    // create a merged stream
    es.merge(tasks).on('end', cb);
  });
});

gulp.task('build', function(cb) {
  // process files of interest
  globby(['src/vjs.js'], function(err, files) {
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
                standalone: 'VJS',
                transform: [glslify],
              })
            .bundle()
            .pipe(source(entry.substring(index + 1)))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(babel())
                //.pipe(uglify())
                .on('error', gutil.log)
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('build')); 
        });

    // create a merged stream
    es.merge(tasks).on('end', cb);
  });
});

// Documentation task with JSDoc
gulp.task('doc', function(done) {
  var cmd = '';
  if (process.platform === 'win32') {
    cmd = 'node_modules\\.bin\\jsdoc -r -c jsdoc.conf -t node_modules\\jsdoc-baseline -d gh-pages\\doc src';
  }else {
    cmd = 'node_modules/.bin/jsdoc -r -c jsdoc.conf -t node_modules/jsdoc-baseline -d gh-pages/doc src';
  }
  exec(cmd, function(e, stdout) {
    gutil.log(stdout);
    done();
  });
});

// Test task with Karma+Jasmine
gulp.task('test', function(done) {
  karma.server.start({
    configFile: __dirname + '/karma.conf.js',
    reporters: ['spec'],
    singleRun: true,
    autoWatch: false
  }, done);
});

// Lint js
gulp.task('jshint', function() {
  return gulp.src([
      'src/**/*.js',
      'examples/**/*.js',
      '!src/parsers/jpx.js',
      '!src/parsers/jpg.js'
    ])
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

// no test anymore... too slow...
gulp.task('js-watch', ['jshint']);
gulp.task('html-watch', ['html'], reload);
gulp.task('css-watch', ['css'], reload);

gulp.task('browsersync', function(){
    // gh-pages mode, no route to web components
  browserSync({
    server: {
      baseDir: ['gh-pages']
    }
  });

  gulp.watch(['src/**/*.js', 'examples/**/*.js'], ['js-watch']);
  gulp.watch(['index.html', 'examples/**/*.html'], ['html-watch']);
  gulp.watch(['examples/**/*.css'], ['html-css']);
});

// Serve task for devs
gulp.task('serve', ['default'], function(cb) {
  runSequence(
    // takes care
    ['browsersync','js-examples-watchify'],
    cb);
});

// Gh-pages task is the default task
gulp.task('default', ['clean'], function(cb) {
  runSequence(
    'jshint',
    //'test',
    'copy', // copy the data over!
    ['html', 'css', 'js-examples'],
    'doc',
    cb);
});
