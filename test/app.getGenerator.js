'use strict';

var path = require('path');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname + '/fixtures');

describe('.generator', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });

  it('should get a generator from the base instance', function() {
    base.register('abc', function() {});
    var generator = base.getGenerator('abc');
    assert(generator);
    assert.equal(typeof generator, 'object');
    assert.equal(generator.name, 'abc');
  });

  it('should get a generator from the base instance from a nested generator', function() {
    base.register('abc', function() {});
    base.register('xyz', function(app) {
      app.register('sub', function(sub) {
        var generator = base.getGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.getGenerator('xyz');
  });

  it('should get a generator from the base instance using `this`', function() {
    base.register('abc', function() {});
    base.register('xyz', function(app) {
      app.register('sub', function(sub) {
        var generator = this.getGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.getGenerator('xyz');
  });

  it('should get a base generator from "app" from a nested generator', function() {
    base.register('abc', function() {});
    base.register('xyz', function(app) {
      app.register('sub', function(sub) {
        var generator = app.getGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.getGenerator('xyz');
  });

  it('should get a nested generator', function() {
    base.register('abc', function(abc) {
      abc.register('def', function() {});
    });

    var generator = base.getGenerator('abc.def');
    assert(generator);
    assert.equal(typeof generator, 'object');
    assert.equal(generator.name, 'def');
  });

  it('should get a deeply nested generator', function() {
    base.register('abc', function(abc) {
      abc.register('def', function(def) {
        def.register('ghi', function(ghi) {
          ghi.register('jkl', function(jkl) {
            jkl.register('mno', function() {});
          });
        });
      });
    });

    var generator = base.getGenerator('abc.def.ghi.jkl.mno');
    assert(generator);
    assert.equal(typeof generator, 'object');
    assert.equal(generator.name, 'mno');
  });

  it('should get a generator that was registered by path', function() {
    base.register('a', fixtures('generators/a'));
    var generator = base.getGenerator('a');
    assert(generator);
    assert(generator.tasks);
    assert(generator.tasks.hasOwnProperty('default'));
  });
});
