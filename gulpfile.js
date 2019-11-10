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
var fs = require("fs");
var imageResize = require('gulp-image-resize');

gulp.task('clean', function() {
    return gulp.src('generated').pipe(clean());
});

// Compiles SCSS files from /scss into /css
gulp.task('sass', function() {
  return gulp.src('scss/main.scss')
    .pipe(sass())
    .pipe(gulp.dest('css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Minify compiled CSS
gulp.task('minify-css', gulp.series('sass', function() {
  return gulp.src('css/main.css')
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
}));

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

gulp.task('minify-image', function () {
    gulp.src('resources/**/*.{png,jpg,jpeg}')
        .pipe(imageResize({ width : 400 }))
        .pipe(rename(function (path) { path.basename += ".preview"; }))
        .pipe(gulp.dest('resources'));
});

gulp.task('generate-gallery', function () {
    var directory = 'u-vody/zahajeni-dyje-2018/';
    exec('cd resources/' + directory + ' && ls -1 *.* | sed -e s/^/\\<span\\>/ -e s:$:\\</span\\>:\n').stdout.on('data', function(data) {
        var files = lsToList(data);
        console.log('<div class="gallery-definition" data-directory="' + directory + '">');
        for (var i in files) {
            var file = files[i];
            if (/\.preview\./.test(file)) {
                console.log('    ' + file);
            }
        }
        console.log('</div>');
        return;
    });

});

var templates;

gulp.task('html', function(done) {
    var info = {
        'news': { source: 'templates/news.html', navlink: 'news', target: 'index.html', replacePipe: newsReplacePipe },
        'older-news': { source: 'templates/older-news.html', navlink: 'older-news', target: 'starsi-novinky.html', replacePipe: olderNewsReplacePipe },
        'archive': { source: 'templates/archive.html', navlink: 'archive', target: 'archiv.html', replacePipe: archiveReplacePipe },
        'operational-information': { source: 'templates/operational-information.html', navlink: 'operational-information', target: 'provozni-informace.html' },
        'children': { source: 'templates/children.html', navlink: 'children', target: 'deti.html' },
        'representation': { source: 'templates/representation.html', navlink: 'representation', target: 'reprezentace.html' },
        'actions': { source: 'templates/actions.html', navlink: 'actions', target: 'akce.html' },
        'by-the-water': { source: 'templates/by-the-water.html', navlink: 'by-the-water', target: 'u-vody.html' },
        'contact': { source: 'templates/contact.html', navlink: 'contact', target: 'kontakt.html' }
    };

    exec('cd templates/ && ls -1 */*.*').stdout.on('data', function(data) {
        templates = lsToMap(data);
        ['news', 'older-news', 'archive', 'operational-information', 'children', 'representation', 'actions', 'by-the-water', 'contact']
            .forEach(function (navlink) {
                var fileInfo = info[navlink];
                var isIndex = fileInfo.target === 'index.html';
                var pipe = gulp.src(fileInfo.source).pipe(concat(fileInfo.target));
                if (fileInfo.replacePipe) {
                    fileInfo.replacePipe(pipe);
                }
                commonReplaceAndInclude(pipe, isIndex).pipe(replace(/nav-link-([_a-z\\-]+)/g, function (match, p1) {
                        return (p1 === fileInfo.navlink ? 'active' : '') + '" href="' + info[p1].target;
                    }))
                    .pipe(gulp.dest('generated'));

            });
    });

    browserSync.reload({ stream: true });
    done();
});

function commonReplaceAndInclude(pipe, isIndex) {
    return pipe.pipe(include())
        .pipe(replace('body-masthead-class', isIndex ? 'with-masthead' : 'without-masthead'))
        .pipe(replace('facebookURL', 'https://www.facebook.com/rybariVysocany/'))
        .pipe(replace('emailAddress', 'info@rybarivysocany.cz'))
        .pipe(replace('phoneNumber', '603 413 665'))
}

function newsReplacePipe(pipe) {
    var dirName = "news";
    var files = templates[dirName];
    pipe.pipe(replace('<!-- list -->', function() {
        return files.slice(0, 10).map(function(w) {
            return '<!--=include ' + dirName + '/' + w + '-->\n<!--=include article-delimiter.html-->';
        }).join('\n');
    }));
}

function olderNewsReplacePipe(pipe) {
    var dirName = "news";
    var files = templates[dirName];
    pipe.pipe(replace('<!-- list -->', function() {
        return files.slice(10).map(function(w) {
            return '<!--=include ' + dirName + '/' + w + '-->\n<!--=include article-delimiter.html-->';
        }).join('\n');
    }));
}

function archiveReplacePipe(pipe) {
    var dirName = "archive";
    var files = templates[dirName];
    if (files != null) {
        pipe.pipe(replace('<!-- list -->', function () {
            return files.map(function (w) {
                var fileContent = fs.readFileSync('templates/' + dirName + '/' + w, "utf8");
                var title = /<h3[^>]*>(.+)<\/h3>/g.exec(fileContent)[1];
                var dateParse = /([0-9]{4})([0-9]{2})([0-9]{2})-([0-9]{2})([0-9]{2})/g.exec(w);
                var date = '' + dateParse[3] + '.' + dateParse[2] + '.' + dateParse[1] + ' ' + dateParse[4] + ':' + dateParse[5];
                var url = 'archiv-' + w;
                var pipe = gulp.src('templates/archive-article.html').pipe(concat(url))
                    .pipe(replace('<!-- article -->', '<!--=include ' + dirName + '/' + w + '-->'));
                commonReplaceAndInclude(pipe, false).pipe(gulp.dest('generated'));
                return '<li><a href="' + url + '">' + title + ' (' + date + ')' + '</a>';
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
    for (var dirName in map) {
        map[dirName] = map[dirName].sort(function (a, b) {
            return a < b ? 1 : -1;
        });
    }
    return map;
}

function lsToList(data) {
    return data.trim().split('\n');
}

// Copy vendor files from /node_modules into /vendor
// NOTE: requires `npm install` before running!
gulp.task('copy', function(done) {
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
  done();
});

// Default task
gulp.task('default', gulp.series(gulp.parallel('sass', 'minify-css', 'minify-js'), 'copy', 'html'));

// Configure the browserSync task
gulp.task('browserSync', function() {
  browserSync.init({
    server: [ 'generated', 'resources' ]
  });
});

// Dev task with browserSync
gulp.task('dev', gulp.series(gulp.parallel('sass', 'minify-css', 'minify-js'), 'copy', 'html', 'browserSync', function() {
  gulp.watch('scss/*.scss', ['sass']);
  gulp.watch('js/*.js', ['minify-js']);
  gulp.watch('templates/**/*.html', ['html']);

  gulp.watch('resources/**/*.*', browserSync.reload);
  gulp.watch('generated/**/*.*', browserSync.reload);
}));