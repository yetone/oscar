var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');
var mocha = require('gulp-mocha');

gulp.task('lint', function() {
  return gulp.src('./js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function() {
  return gulp.src('src/app.js')
    .pipe(rename('oscar.js'))
    .pipe(browserify({
      insertGlobals: false,
      debug: false
    }))
    .pipe(gulp.dest('dist'))
    .pipe(rename('oscar.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('test', function() {
  return gulp.src('test/test.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('default', function() {
  gulp.run('lint', 'scripts');
  gulp.watch(['src/*.js', 'src/**/*.js'], function() {
    gulp.run('lint', 'scripts');
  });
});
