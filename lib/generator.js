'use strict';

module.exports = function(app, base, env) {
  console.log('this is the default generator');

  app.task('default', function(cb) {
    console.log('generator > default');
    cb();
  });
};
