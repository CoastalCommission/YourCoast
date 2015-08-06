module.exports = (function() {
  var config = {

    // temp location
    temp: './.tmp/',

    // build location
    build: './build',

    // index location
    index: 'index.html',

    // all JS locations
    JS: [
      './**/*.js',
      './*.js',
      '!./node_modules/**',
      '!./bower_components/**',
      '!./build/**',
      '!./gulp.config.js',
      '!./gulpfile.js'
    ],

    // all CSS locations
    CSS: [
      './css/custom.css'
    ],

    // bower settings
    bower: {
      json: './bower.json',
      directory: './bower_components/',
      ignorePath: '../..'
    }
  };

  config.getWiredepDefaultOptions = function () {
    var options = {
      bowerJSON: config.bower.json,
      directory: config.bower.directory,
      ignorePath: config.bower.ignorePath
    };

    return options;
  }

  return config;
})();
