'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

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
});
