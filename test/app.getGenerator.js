'use strict';

var path = require('path');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

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
});
