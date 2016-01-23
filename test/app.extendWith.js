'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

describe('.invoke', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });
  
  it('should get a named generator', function(cb) {
    base.register('foo', function(app) {
      app.extendWith('bar');
      cb();
    });

    base.register('bar', function(app) {
      app.task('a', function() {});
      app.task('b', function() {});
      app.task('c', function() {});
    });

    base.getGenerator('foo');
  });

  it('should extend a generator with a named generator', function(cb) {
    base.register('foo', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);

      app.extendWith('bar');
      assert(app.tasks.a);
      assert(app.tasks.b);
      assert(app.tasks.c);
      cb();
    });

    base.register('bar', function(app) {
      app.task('a', function() {});
      app.task('b', function() {});
      app.task('c', function() {});
    });

    base.getGenerator('foo');
  });

  it('should extend a generator with an array of generators', function(cb) {
    base.register('foo', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);

      app.extendWith(['bar', 'baz', 'qux']);
      assert(app.tasks.a);
      assert(app.tasks.b);
      assert(app.tasks.c);
      cb();
    });

    base.register('bar', function(app) {
      app.task('a', function() {});
    });

    base.register('baz', function(app) {
      app.task('b', function() {});
    });

    base.register('qux', function(app) {
      app.task('c', function() {});
    });

    base.getGenerator('foo');
  });
});
