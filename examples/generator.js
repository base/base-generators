'use strict';


module.exports = function(app) {
  app.register('foo', require('./generators/instance'));

  app.task('default', function(cb) {
    console.log('base > default');
    cb();
  });

  app.task('a', function(cb) {
    console.log('base > a');
    cb();
  });

  app.task('b', function(cb) {
    console.log('base > b');
    cb();
  });

  app.task('c', function(cb) {
    console.log('base > c');
    cb();
  });
};
