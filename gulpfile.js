var gulp = require('gulp');
var args = require('yargs').argv;
var $ = require('gulp-load-plugins')({lazy:true});
var config = require('./gulp.config')();
var del = require('del')
// var jshint = require('gulp-jshint');
// var jscs = require('gulp-jscs');
// var gulpprint = require('gulp-print');
// var gulpif = require('gulp-if');
// var util = require('gulp-util');




gulp.task('hello-world',function()
{
    console.log('hello gulp');
});

gulp.task('vet',function()
{
    log('analyzing source with JSHint and JSCS');
    return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose,$.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish',{verbose : true}))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('styles', ['clean-styles'], function () {
    log('compiling Less --> CSS')
    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({browsers:['last 2 version', '> 5%']}))
        .pipe(gulp.dest(config.temp));

});

gulp.task('clean-styles',function(done) {
    var files = config.temp + '**/*.css';
    clean(files, done);
});

gulp.task('less-watcher', function () {
    gulp.watch([config.less], ['styles']);
});

gulp.task('wiredep',function(){
    log('Wire up the bower css js and our app js into the html');
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;
    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});

gulp.task('inject',['wiredep','styles'], function(){
    log('Wire up the app css into the html , and call wiredep');
    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});
//////////


function clean(path, done){
    log('cleaning: ' +  $.util.colors.blue(path));
    //console.log(done);
    del(path , done());
};

function log(msg) {
    if(typeof (msg) === 'object'){
        for(var item in msg){
            if(msg.hasOwnProperty(item)){
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else{
        $.util.log($.util.colors.blue(msg));
    }
}
