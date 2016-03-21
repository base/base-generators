'use strict';

var generators = require('../../..');
var Base = require('../../support/app');
Base.use(generators(Base));
var base = new Base();

base.task('default', function() {});
base.task('a', function() {});
base.task('b', function() {});
base.task('c', function() {});

base.register('foo', function(app) {
  app.task('x', function() {});
  app.task('y', function() {});
  app.task('z', function() {});
});

/**
 * Expose this instance of `Generate`
 */

module.exports = base;
