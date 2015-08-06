
var gulp    = require('gulp'),
    config  = require('./gulp.config'),
    args    = require('yargs').argv,
    del     = require('del'),
    $       = require('gulp-load-plugins')({ lazy: true });

gulp.task('js', function() {
  return gulp
      .src(config.JS)
      .pipe($.if(args.verbose, $.print()))
      // .pipe($.jscs())
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish', { verbose: true }))
      .pipe($.jshint.reporter('fail'));
});


gulp.task('clean-css', function(done) {
  var files = config.temp + '**/*.css';
  clean(files, done);
});


gulp.task('clean-build', function(done) {
  var files = config.build + '/**';
  clean(files, done);
});


gulp.task('css', ['clean-css'], function() {
  return gulp
      .src(config.CSS)
      .pipe($.autoprefixer())
      .pipe(gulp.dest(config.build));
});


gulp.task('wiredep', function() {
  var options = config.getWiredepDefaultOptions(),
      wiredep = require('wiredep').stream;

  return gulp
    .src(config.index)
    .pipe(wiredep(options))
    .pipe($.inject(gulp.src(config.JS)))
    .pipe(gulp.dest(config.build));
});


gulp.task('inject', ['wiredep', 'css'], function() {
  return gulp
    .src(config.index)
    .pipe($.inject(gulp.src(config.CSS)))
    .pipe(gulp.dest(config.build));
});


// log util
function log(msg) {
  if(typeof(msg) === 'object') {
    for (var item in msg) {
      if(msg.hasOwnProperty(item)) {
        $.util.log($.util.colors.blue(msg[item]));
      }
    }
  } else {
    $.util.log($.util.colors.blue(msg));
  }
}

// clean all in path
function clean(path, done) {
  log("Cleaning: " + $.util.colors.blue(path));
  del(path, done);
}

// log & emit error
function errorLogger(error) {
  log('*** start of error ***');
  log(error);
  log('*** end of error ***');
  this.emit('end');
}
