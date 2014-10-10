var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');

gulp.task('lint', function() {
  gulp.src('./js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function() {
  gulp.src('src/app.js')
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

gulp.task('default', function() {
  gulp.run('lint', 'scripts');
});
