'use strict';
// generated on 2014-05-22 using generator-gulp-webapp 0.1.0

var gulp = require('gulp');
var browserify = require('gulp-browserify');
var compiler = require('gulp-hogan-compile');
var gutil = require('gulp-util');
var deploy = require('gulp-gh-pages');
var fruitCssFinder = require('./gulp-import-gen').css;
var fruitJSFinder = require('./gulp-import-gen').js;

// load plugins
var $ = require('gulp-load-plugins')();

gulp.task('deploy', ['build'],function () {
    gulp.src('./dist/**/*')
        .pipe(deploy({}));
});

gulp.task('templates', function() {
    gulp.src('app/fruit/**/*.html')
        .pipe(compiler('templates.js', {
            wrapper: 'commonjs',
            hoganModule: 'hogan-updated'
        }))
        .pipe(gulp.dest('app/fruit'));
});

gulp.task('compile-fruit-style', function () {

    return gulp.src('app/fruit/*/_style.scss')
        .pipe(fruitCssFinder('app/fruit'))
        .pipe(gulp.dest('app/fruit'));
});

gulp.task('compile-fruit-javascript', function () {

    return gulp.src('app/fruit/*/index.js')
        .pipe(fruitJSFinder('app/fruit'))
        .pipe(gulp.dest('app/fruit'));
});

gulp.task('styles', ['compile-fruit-style'] , function () {
    return gulp.src('app/main.scss')
        .pipe($.rubySass({
            style: 'expanded',
            precision: 10
        }))
        .on('error', gutil.log)
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('dist/styles'))
        .pipe($.size());
});

gulp.task('scripts', ['templates', 'compile-fruit-javascript'], function () {
    return gulp.src('app/_javascript/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.size());
});

gulp.task('browserify', ['scripts'], function () {
    return gulp.src('app/_javascript/main.js')
        .pipe(browserify({
          insertGlobals : true,
          debug : !gulp.env.production
        }))
        .on('error', gutil.log)
        .pipe(gulp.dest('app/scripts'))
        .pipe(gulp.dest('dist/scripts'));
});

gulp.task('html', ['styles', 'browserify'], function () {
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');

    return gulp.src('app/*.html')
        .pipe(jsFilter)
        .pipe($.uglify())
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore())
        .pipe($.useref.restore())
        .pipe($.useref())
        .pipe(gulp.dest('dist'))
        .pipe($.size());
});

gulp.task('images', function () {

    return gulp.src('app/images/**/*')
        .pipe($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size());
});

gulp.task('fonts', function () {
    return gulp.src('app/fonts/*.{eot,svg,ttf,woff}')
        .pipe($.flatten())
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size());
});

gulp.task('extras', function () {
    return gulp.src(['app/*.*', '!app/*.html'], { dot: true })
        .pipe(gulp.dest('dist'));
});

gulp.task('build', ['html', 'images', 'fonts', 'extras']);

gulp.task('default', function () {
    gulp.start('build');
});

gulp.task('connect', function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({
            port: 35729,
            src: 'http://localhost:35729/livereload.js?snipver=1'
        }))
        .use(connect.static('app'))
        .use(connect.static('dist'))
        .use(connect.directory('app'));

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:9000');
        });
});

gulp.task('serve', ['connect', 'watch'], function () {
    require('opn')('http://localhost:9000');
});

// inject bower components
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app/styles'));

    gulp.src('app/*.html')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('watch', ['build'], function () {
    var server = $.livereload();

    gulp.watch('app/**/*.scss', ['styles'])
    gulp.watch('app/_javascript/**/*.{js,json}', ['browserify']);
    gulp.watch('app/fruit/**/*.{js,json}', ['browserify']);
    gulp.watch('app/fruit/*/*.html', ['templates']);
    gulp.watch('app/fruit/templates.js', ['browserify']);
    gulp.watch('app/images/**/*', ['images']);
    gulp.watch('bower.json', ['wiredep']);

    // watch for changes

    gulp.watch([
        'app/*.html',
        'dist/styles/**/*.css',
        'app/scripts/**/*.js',
        'app/images/**/*'
    ]).on('change', function (file) {
        server.changed(file.path);
    });
});