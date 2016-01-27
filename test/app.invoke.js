'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var gm = require('global-modules');
var commands = require('spawn-commands');
var Base = require('base');
var utils = require('../lib/utils');
var generators = require('..');
var base;

var fixture = path.resolve.bind(path, __dirname, 'fixtures/generators');
function install(name, cb) {
  commands({
    args: ['install', '-g', '--silent', name],
    cmd: 'npm'
  }, cb);
}

describe('.invoke', function() {
  before(function(cb) {
    if (!utils.exists(path.resolve(gm, 'generate-bar'))) {
      install('generate-bar', cb);
    } else {
      cb();
    }
  });

  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });
  
  it('should invoke a named generator', function(cb) {
    base.register('foo', function(app) {
      app.invoke('bar');
      cb();
    });

    base.register('bar', function(app) {
      app.task('a', function() {});
      app.task('b', function() {});
      app.task('c', function() {});
    });

    base.getGenerator('foo');
  });

  it('should invoke a generator function from an instance', function(cb) {
    base.register('foo', function(app) {
      var bar = app.getGenerator('bar');
      app.invoke(bar);
      cb();
    });

    base.register('bar', function(app) {
      app.task('a', function() {});
      app.task('b', function() {});
      app.task('c', function() {});
    });

    base.getGenerator('foo');
  });

  it('should extend a generator with a generate invoked by name', function(cb) {
    base.register('foo', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);

      app.invoke('bar');
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

  it('should extend a generator with a generate invoked by alias', function(cb) {
    base.register('foo', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);

      app.invoke('qux');
      assert(app.tasks.a);
      assert(app.tasks.b);
      assert(app.tasks.c);
      cb();
    });

    base.register('generate-qux', function(app) {
      app.task('a', function() {});
      app.task('b', function() {});
      app.task('c', function() {});
    });

    base.getGenerator('foo');
  });

  it('should extend with a generator invoked by filepath', function(cb) {
    base.register('foo', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);

      app.invoke(fixture('qux'));
      assert(app.tasks.a);
      assert(app.tasks.b);
      assert(app.tasks.c);
      cb();
    });

    base.getGenerator('foo');
  });

  it('should extend with a generator invoked from node_modules by name', function(cb) {
    base.register('abc', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);

      app.invoke('generate-foo');
      assert(app.tasks.a);
      assert(app.tasks.b);
      assert(app.tasks.c);
      cb();
    });

    base.getGenerator('abc');
  });

  it('should extend with a generator invoked from node_modules by alias', function(cb) {
    base.register('abc', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);

      app.invoke('foo');
      assert(app.tasks.a);
      assert(app.tasks.b);
      assert(app.tasks.c);
      cb();
    });

    base.getGenerator('abc');
  });

  it('should extend with a generator invoked from global modules by name', function(cb) {
    base.register('zzz', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);
      app.invoke('generate-bar');

      assert(app.tasks.a);
      assert(app.tasks.b);
      assert(app.tasks.c);
      cb();
    });

    base.getGenerator('zzz');
  });

  it('should extend with a generator invoked from global modules by alias', function(cb) {
    base.register('zzz', function(app) {
      assert(!app.tasks.a);
      assert(!app.tasks.b);
      assert(!app.tasks.c);

      app.invoke('bar');
      assert(app.tasks.a);
      assert(app.tasks.b);
      assert(app.tasks.c);
      cb();
    });

    base.getGenerator('zzz');
  });
});
