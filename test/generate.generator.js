'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

describe('.generator', function() {
  beforeEach(function() {
    base = new Base();
    base.use(generators());
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
    assert(typeof abc === 'object');
  });

  it('should get a generator by name', function() {
    base.generator('base-abc', function() {});
    var abc = base.generator('generator-abc');
    assert(abc);
    assert(typeof abc === 'object');
  });

  it('should use a custom function to create the alias', function() {
    base.option('alias', function(name) {
      return name.slice(name.lastIndexOf('-') + 1);
    });

    base.generator('base-abc-xyz', function() {});
    assert(base.generators.hasOwnProperty('xyz'));
  });
});
