'use strict';

module.exports = function(app, base, env, options) {
  app.task('default', function(cb) {
    console.log('generator', app.name, '> task', this.name);
    cb();
  });

  app.task('git', function(cb) {
    console.log('generator', app.name, '> task', this.name);
    cb();
  });
};
