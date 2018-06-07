let gulp = require('gulp');
let sass = require('gulp-sass');
let gutil = require('gulp-util');
let server = require('gulp-server-livereload');
let watcher = require('gulp-watch');
let pug = require('gulp-pug');
let concat = require('gulp-concat');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify');
let ts = require('gulp-typescript');
let cssmin = require('gulp-cssmin');
let checkCSS = require( 'gulp-check-unused-css' );
let minifyjs = require('gulp-minify');
let argv = require('yargs').argv;
let newfile = require('gulp-file');
let gfi = require("gulp-file-insert");
let replace = require("gulp-replace");
let removeCode = require('gulp-remove-code');
let cmsPrep = require('gulp-cms-prep');
let runSequence = require('run-sequence');
let postcss = require('gulp-postcss');
let inject = require('gulp-inject-string');
let strip = require('gulp-strip-comments');
let htmlbeautify = require('gulp-html-beautify');
let pxtorem = require('postcss-pxtorem');
let gulpMerge = require('gulp-merge');
let each = require('gulp-each');
let fs = require('fs');
let glob = require('glob');
let clean = require('gulp-clean');
let insertLines = require('gulp-insert-lines');
let deleteLines = require('gulp-delete-lines');

// copy sass, concatinate and minify
var processors = [
   pxtorem()
];

gulp.task('sass', function() {
  return gulp.src('dev/**/**/*.scss')
  .pipe(concat('main.scss'))
  .pipe(sass({style: 'compressed'}))
    .on('error', gutil.log)
  .pipe(postcss(processors))
  .pipe(cssmin())
  .pipe(gulp.dest('dist/styles'))
});

// copy index and convert to html
gulp.task('index', function() {
  gulp.src('dev/index.pug')
  .pipe(pug({pretty: '\t',}))
  .pipe(removeCode({devSection : true}))
  .pipe(strip())
  .pipe(htmlbeautify())
  .pipe(gulp.dest('dist'))
});

// copy pages and convert to html
gulp.task('pug', function buildHTML() {
  gulp.src(['dev/pages/**/*.pug','dev/pages/index.pug','!dev/pages/admin/**/*.pug','!dev/pages/admin/*.pug'])
  .pipe(pug({pretty: '\t',}))
  .pipe(removeCode({devSection : true}))
  .pipe(strip())
  .pipe(htmlbeautify())
  .pipe(rename({dirname: ''}))
  .pipe(gulp.dest('dist'))

  return gulp.src('dev/pages/admin/**/*.pug')
  .pipe(pug({pretty: '\t',}))
  .pipe(removeCode({devSection : true}))
  .pipe(strip())
  .pipe(htmlbeautify())
  .pipe(rename({dirname: '/admin'}))
  .pipe(gulp.dest('dist'))
});

// copy js libraries all js-libararies in this folder must alreayd be minified
gulp.task('js-libraries', function buildHTML() {
  return gulp.src('dev/js-libraries/*.js')
  .pipe(rename({dirname: ''}))
  .pipe(concat('libraries.js'))
  .pipe(gulp.dest('dist/js'))
});

//copy common js functions
gulp.task('js-common', function buildHTML() {
  return gulp.src('dev/js-common/*.{ts,js}')
  .pipe(ts({
        noImplicitAny: true
   }))
  .pipe(rename({dirname: ''}))
  .pipe(gulp.dest('dist/js'))
});

//copy assets(images/fonts)
gulp.task('assets', ()=> {
    return gulp.src('dev/assets/**/*')
        .pipe(gulp.dest('dist/assets'))
});

// concat typescript components
gulp.task('componentConcat', function(){
    return gulp.src('dev/components/**/*.ts')
        .pipe(concat('/temp.ts'))
        .pipe(gulp.dest('dev/'));
})

// convert typescript and concat components
gulp.task('componentMerge', function() {
    //gulp.start('componentConcat');
    gulp.src('dev/js-common/components.ts')
        .pipe(gfi({
            '/* file 1 */' : 'dev/temp.ts'
        }))
        .pipe(ts({
            noImplicitAny: true
        }))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('componentBuild',function( callback) {
    runSequence('componentConcat', 'componentMerge', callback);
});

// copy and convert typescipt to javascript
gulp.task('typescript', function () {
    return gulp.src('dev/pages/**/*.ts')
        .pipe(ts({
            noImplicitAny: true
        }))
        .pipe(rename({dirname: ''}))
        .pipe(gulp.dest('dist/js'));
});

// remove all uneccasary css
gulp.task('purgecss', function () {
    return gulp.src([ 'dist/styles/*.css', 'dist/**/*.html' ])
    .pipe( checkCSS() )
});

// watch for file changes
gulp.task('watch', function() {
    gulp.watch('dev/**/**/*.scss', ['sass'])
    gulp.watch('dev/index.pug', ['index'])
    gulp.watch('dev/**/**/*.pug', ['pug'])
    gulp.watch('dev/js/*.js', ['js'])
    gulp.watch('dev/**/**/*.ts', ['typescript', 'js-common'])
    gulp.watch('dev/components/**/*.ts'['componentBuild'])
});

// webserver
gulp.task('webserver', function() {
  gulp.src('dist')
    .pipe(server({
      port: 3333,
      livereload: true,
      directoryListing: false,
      open: true
    }));
});

gulp.task('default', [
    'index',
    'pug',
    'sass',
    'assets',
    'js-libraries',
    'js-common',
    'componentBuild',
    'watch',
    'typescript',
    'webserver'
    ]
);
