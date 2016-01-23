'use strict';

var config = require('base-config');

module.exports = function(app) {
  app.use(config());

  app.config.map('bar', function() {
    console.log('config BAR')
  });

  app.task('default', function(cb) {
    console.log('fixtures/a > default');
    cb();
  });
};
