var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var include = require("gulp-include");
var exec = require('child_process').exec;
var clean = require('gulp-clean');
var wait = require('gulp-wait');

gulp.task('clean', function() {
    return gulp.src('generated').pipe(clean());
});

// Compiles SCSS files from /scss into /css
gulp.task('sass', function() {
  return gulp.src('scss/main.scss')
    .pipe(sass())
    .pipe(gulp.dest('generated/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Minify compiled CSS
gulp.task('minify-css', ['sass'], function() {
  return gulp.src('generated/css/main.css')
    .pipe(cleanCSS({
      compatibility: 'ie8'
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('generated/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Minify custom JS
gulp.task('minify-js', function() {
  return gulp.src('js/main.js')
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('generated/js'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

var templates;

gulp.task('html', function() {
    var info = {
        'news': { source: 'templates/_news.html', navlink: 'news', target: 'index.html', replacePipe: newsReplacePipe },
        'older-news': { source: 'templates/_older-news.html', navlink: 'older-news', target: 'starsi-novinky.html', replacePipe: olderNewsReplacePipe },
        'archive': { source: 'templates/_archive.html', navlink: 'archive', target: 'archiv.html', replacePipe: archiveReplacePipe },
        'operational-information': { source: 'templates/_operational-information.html', navlink: 'operational-information', target: 'provozni-informace.html' },
        'children': { source: 'templates/_children.html', navlink: 'children', target: 'deti.html' },
        'representation': { source: 'templates/_representation.html', navlink: 'representation', target: 'reprezentace.html' },
        'actions': { source: 'templates/_actions.html', navlink: 'actions', target: 'akce.html' },
        'by-the-water': { source: 'templates/_by-the-water.html', navlink: 'by-the-water', target: 'u-vody.html' },
        'contact': { source: 'templates/_contact.html', navlink: 'contact', target: 'kontakt.html' }
    };

    exec('cd templates/ && ls -1 */*').stdout.on('data', function(data) {
        templates = lsToMap(data);
        ['news', 'older-news', 'archive', 'operational-information', 'children', 'representation', 'actions', 'by-the-water', 'contact']
            .forEach(function (navlink) {
                var fileInfo = info[navlink];
                var isIndex = fileInfo.target === 'index.html';
                var pipe = gulp.src(fileInfo.source).pipe(concat(fileInfo.target));
                if (fileInfo.replacePipe) {
                    fileInfo.replacePipe(pipe);
                }
                pipe.pipe(include())
                    .pipe(replace('body-masthead-class', isIndex ? 'with-masthead' : 'without-masthead'))
                    .pipe(replace(/nav-link-([_a-z\\-]+)/g, function (match, p1) {
                        return (p1 === fileInfo.navlink ? 'active' : '') + '" href="' + info[p1].target;
                    }))
                    .pipe(replace('facebookURL', 'https://www.facebook.com/rybariVysocany/'))
                    .pipe(replace('emailAddress', 'info@rybarivysocany.cz'))
                    .pipe(replace('phoneNumber', '603 413 665'))
                    .pipe(gulp.dest('generated'));

            });
    });

    browserSync.reload({ stream: true });
});

function newsReplacePipe(pipe) {
    var dirName = "news";
    var files = templates[dirName];
    pipe.pipe(replace('<!-- list -->', function() {
        return files.sort(function (a, b) {
            return a < b ? 1 : -1;
        }).slice(0, 10).map(function(w) {
            return '<!--=include ' + dirName + '/' + w + '-->\n<!--=include _article-delimiter.html-->';
        }).join('\n');
    }));
}

function olderNewsReplacePipe(pipe) {
    var dirName = "news";
    var files = templates[dirName];
    pipe.pipe(replace('<!-- list -->', function() {
        return files.sort(function (a, b) {
            return a < b ? 1 : -1;
        }).slice(10).map(function(w) {
            return '<!--=include ' + dirName + '/' + w + '-->\n<!--=include _article-delimiter.html-->';
        }).join('\n');
    }));
}

function archiveReplacePipe(pipe) {
    var dirName = "archive";
    var files = templates[dirName];
    if (files != null) {
        pipe.pipe(replace('<!-- list -->', function () {
            return files.map(function (w) {
                return '<!--=include ' + dirName + '/' + w + '-->\n<!--=include _article-delimiter.html-->';
            }).join('\n');
        }));
    }
}

function lsToMap(data) {
    var files = data.trim().split('\n');
    var map = { };
    for (var i in files) {
        var file = files[i].split("/");
        var dir = map[file[0]];
        if (dir == null) {
            dir = [ ];
            map[file[0]] = dir;
        }
        dir.push(file[1]);
    }
    return map;
}

// Copy vendor files from /node_modules into /vendor
// NOTE: requires `npm install` before running!
gulp.task('copy', function() {
  gulp.src([
      'node_modules/bootstrap/dist/**/*',
      '!**/npm.js',
      '!**/bootstrap-theme.*',
      '!**/*.map'
    ])
    .pipe(gulp.dest('generated/vendor/bootstrap'));

  gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
    .pipe(gulp.dest('generated/vendor/jquery'));

  gulp.src(['node_modules/jquery.easing/*.js'])
    .pipe(gulp.dest('generated/vendor/jquery-easing'));

  gulp.src([
      'node_modules/font-awesome/**',
      '!node_modules/font-awesome/**/*.map',
      '!node_modules/font-awesome/.npmignore',
      '!node_modules/font-awesome/*.txt',
      '!node_modules/font-awesome/*.md',
      '!node_modules/font-awesome/*.json'
    ])
    .pipe(gulp.dest('generated/vendor/font-awesome'));
});

// Default task
gulp.task('default', ['sass', 'minify-css', 'minify-js', 'copy', 'html']);

// Configure the browserSync task
gulp.task('browserSync', function() {
  browserSync.init({
    server: [ 'generated', 'resources' ]
  });
});

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'sass', 'minify-css', 'minify-js', 'copy', 'html'], function() {
  gulp.watch('scss/*.scss', ['sass']);
  gulp.watch('js/*.js', ['minify-js']);
  gulp.watch('templates/**/*.html', ['html']);

  gulp.watch('resources/**/*.*', browserSync.reload);
  gulp.watch('generated/**/*.*', browserSync.reload);
});