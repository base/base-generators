'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

describe('.alias', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });

  it('should create an alias from a name with a dash', function() {
    assert.equal(base.alias('foo-bar'), 'bar');
  });

  it('should create an alias using the given prefix', function() {
    assert.equal(base.alias('foo-bar', {prefix: 'f'}), 'oo-bar');
  });

  it('should create an alias using the given alias function', function() {
    var alias = base.alias('one-two-three', {
      alias: function(name) {
        return name.slice(name.lastIndexOf('-') + 1);
      }
    });
    assert.equal(alias, 'three');
  });
});
