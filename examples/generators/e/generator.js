'use strict';

/**
 * testing...
 */

module.exports = function(app, base, env) {
  app.task('default', function(cb) {
    console.log('e > default');
    cb();
  });

  app.generator('c', require('../c'));
};
