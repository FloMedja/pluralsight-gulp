var gulp = require('gulp');
var args = require('yargs').argv;
var $ = require('gulp-load-plugins')({lazy:true});
var config = require('./gulp.config')();
var del = require('del')
var browserSync = require('browser-sync')
// var jshint = require('gulp-jshint');
// var jscs = require('gulp-jscs');
// var gulpprint = require('gulp-print');
// var gulpif = require('gulp-if');
// var util = require('gulp-util');
var port = process.env.PORT || config.defaultPort;

gulp.task('help',$.taskListing);
gulp.task('hello-world',function()
{
    console.log('hello gulp');
});

gulp.task('default',['help']);

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

// copy images in build folder
gulp.task('images',['clean-images'],function(){
   log('Copying and compressing the images');
   return gulp
       .src(config.images)
       .pipe($.imagemin({optimizationLevel : 4}))
       .pipe(gulp.dest(config.build + 'images'));

});

// copy fonts in build folder
gulp.task('fonts',['clean-fonts'],function(){
    log('Copying fonts');
    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));

});

// clean
gulp.task('clean',function(done) {
    var delconfig = [].concat(config.build,config.temp);
    log('Cleaning: ' +  $.util.colors.blue(delconfig));
    del(delconfig,done);
});
// clean fonts from build folder
gulp.task('clean-fonts',function(done) {
    clean(config.build + 'fonts/**/*.*',done);
});

// clean images from build folder
gulp.task('clean-images',function(done) {
    clean(config.build + 'images/**/*.*',done);

});

// clean styles
gulp.task('clean-styles',function(done) {
    clean(config.temp + '**/*.css', done);
});

// clean styles
gulp.task('clean-code',function(done) {
    var files = [].concat(
        config.temp + '**/*.js',
        config.build + '**/*.html',
        config.build + 'js/**/*.js'
    );
    clean(files, done);
});

gulp.task('less-watcher', function () {
    gulp.watch([config.less], ['styles']);
});

gulp.task('templatecache',['clean-code'],function(){
    log('Creating AngulatJS $templateCache');

    return gulp
        .src(config.htmltemplates)
        .pipe($.minifyHtml({empty:true}))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options))
        .pipe(gulp.dest(config.temp));
})


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

//TODO : syn browsers with nodemon
gulp.task('serve-dev',['inject'],function(){
    var isDev = true ;
   // var port =7203;
    var nodeOptions ={
        script : config.nodeServer,
        delayTime : 1 ,
        env : {
            'PORT': config.defaultPort,
            'NODE_ENV': isDev ? 'dev' :  'build'
        },
        watch : [config.server]
    };
    return $.nodemon(nodeOptions)
        .on('restart',function (ev) {
            log('*** nodemon restarted');
            log('files changed on restart:\n' + ev);
        })
        .on('start',function () {
            log('*** nodemon started');
            startBrowserSync();
        })
        .on('crash',function () {
            log('*** nodemon crashed : script crashed for some reason');
        })
        .on('exit',function () {
            log('*** nodemon exited cleanly');
        });
});
//////////

function startBrowserSync()
{
    if(browserSync.active)
    {
        return;
    }
    log('Starting browser-sync on port' + port);

    var options = {
        proxy : 'localhost' + port ,
        port : 3000,
        files : [config.client + '**/*.*'],
        ghostMode: {
             clicks : true ,
            location : false,
            forms : true ,
            scroll : true ,
        },
        injectChanges : true,
        logFileChanges : true,
        logLevel : 'debug',
        logPrefix : 'gulp-patterns',
        notify : true,
        reloadDelay : 1000
    }
}
function clean(path, done){
    log('cleaning: ' +  $.util.colors.blue(path));

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
