'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

describe('.generator', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });
  
  it('should register a generator function by name', function() {
    base.generator('foo', function() {});
    assert(base.generators.hasOwnProperty('foo'));
  });

  it('should register a generator function by alias', function() {
    base.generator('base-abc', function() {});
    assert(base.generators.hasOwnProperty('abc'));
  });

  it('should get a generator by alias', function() {
    base.generator('base-abc', function() {});
    var abc = base.generator('abc');
    assert(abc);
    assert.equal(typeof abc, 'object');
  });

  it('should get a generator by name', function() {
    base.generator('base-abc', function() {});
    var abc = base.generator('generator-abc');
    assert(abc);
    assert.equal(typeof abc, 'object');
  });

  it('should use a custom function to create the alias', function() {
    base.option('alias', function(name) {
      return name.slice(name.lastIndexOf('-') + 1);
    });

    base.generator('base-abc-xyz', function() {});
    assert(base.generators.hasOwnProperty('xyz'));
  });

  it('should invoke a registered generator when `getGenerator` is called', function(cb) {
    base.register('foo', function() {
      cb();
    });
    base.getGenerator('foo');
  });

  it('should expose an app\'s generators on app.generators', function(cb) {
    base.register('foo', function(app) {
      app.register('a', function() {});
      app.register('b', function() {});

      app.generators.hasOwnProperty('a');
      app.generators.hasOwnProperty('b');
      cb();
    });

    base.getGenerator('foo');
  });

  it('should expose a generator\'s tasks on app.tasks', function(cb) {
    base.register('foo', function(app) {
      app.task('a', function() {});
      app.task('b', function() {});
      assert(app.tasks.a);
      assert(app.tasks.b);
      cb();
    });

    base.getGenerator('foo');
  });

  it('should expose all root generators on base.generators', function(cb) {
    base.register('foo', function(app, b) {
      b.generators.hasOwnProperty('foo');
      b.generators.hasOwnProperty('bar');
      b.generators.hasOwnProperty('baz');
      cb();
    });

    base.register('bar', function(app, base) {});
    base.register('baz', function(app, base) {});
    base.getGenerator('foo');
  });

  it('should get a generator from another generator', function(cb) {
    base.register('foo', function(app, b) {
      var bar = b.getGenerator('bar');
      assert(bar);
      cb();
    });

    base.register('bar', function(app, base) {});
    base.register('baz', function(app, base) {});
    base.getGenerator('foo');
  });

  it('should get a generator\'s tasks from another generator', function(cb) {
    base.register('foo', function(app, b) {
      var baz = b.getGenerator('baz');
      var task = baz.tasks.aaa;
      assert(task);
      cb();
    });

    base.register('bar', function(app, base) {});
    base.register('baz', function(app, base) {
      app.task('aaa', function() {});
    });
    base.getGenerator('foo');
  });
});
