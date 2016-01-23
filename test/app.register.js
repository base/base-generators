'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname + '/fixtures');

describe('.register', function() {
  beforeEach(function() {
    base = new Base();
    base.use(generators());
  });
  
  it('should register a generator function by name', function() {
    base.register('foo', function() {});
    assert(base.generators.hasOwnProperty('foo'));
  });

  it('should register a generator function by alias', function() {
    base.register('base-abc', function() {});
    assert(base.generators.hasOwnProperty('abc'));
  });

  it('should register a generator from a filepath', function() {
    base.register('base-abc', 'test/fixtures/generators/a/generator.js');
    assert(base.generators.hasOwnProperty('abc'));
  });

  it('should use a custom function to create the alias', function() {
    base.option('alias', function(name) {
      return name.slice(name.lastIndexOf('-') + 1);
    });

    base.register('base-abc-xyz', function() {});
    assert(base.generators.hasOwnProperty('xyz'));
  });

  it('should get a generator that was registered as a function', function() {
    base.register('foo', function(app) {
      app.task('default', function() {});
    });
    var generator = base.getGenerator('foo');
    assert(generator);
    assert(generator.tasks);
    assert(generator.tasks.hasOwnProperty('default'));
  });

  it('should register a generator by path', function() {
    base.register('a', fixtures('generators/a'));
  });

  it('should get a generator that was registered by path', function() {
    base.register('a', fixtures('generators/a'));
    var generator = base.getGenerator('a');
    assert(generator);
    assert(generator.tasks);
    assert(generator.tasks.hasOwnProperty('default'));
  });
});
