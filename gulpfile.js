var gulp = require('gulp')
var gutil = require('gulp-util')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var replace = require('gulp-replace')
var wrap = require('gulp-wrap')
var concat = require('gulp-concat')
var minifyCSS = require('gulp-minify-css')
var stripDebug = require('gulp-strip-debug')
var uglify = require('gulp-uglify')
var declare = require('gulp-declare')
var autoprefix = require('gulp-autoprefixer')

var express = require('express');
var app = express();

if(app.get('env') === 'development'){
  var config = require('./config/config-dev');
} else {
  var config = require('./config/config');
}

gulp.task('default', ['watch']);

gulp.task('watch', function(){

  gulp.watch('source/scss/*.scss', ['build-css'])
  gulp.watch('source/js/*.js', ['main-scripts'])

})

gulp.task('socket-url-replace', function(){
  gulp.src(['public/js/local/*'],{base: "./"})
    .pipe(replace('http://localhost:5050', config.url))
    .pipe(gulp.dest("./"))
})

gulp.task('strip-minify', function(){
  gulp.src(['public/js/local/*.js'],{base: "./"})
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest("./"))
})

gulp.task('build-css', function(){
  return gulp.src('source/scss/*.scss')
    .pipe(sourcemaps.init())
      .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('public/css/local'))
})

gulp.task('main-scripts', function(){
  gulp.src('source/js/*.js')
    .pipe(concat('main.js'))
    .pipe(gulp.dest('public/js/local/'))
})
