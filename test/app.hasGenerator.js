'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

describe('.hasGenerator', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });

  it('should return true if a generator is registered', function() {
    base.register('foo', function(app) {
    });
    assert(base.hasGenerator('foo'));
  });

  it('should return false if a generator is not registered', function() {
    base.register('foo', function(app) {
      app.register('bar', function() {});
    });
   
    assert(!base.hasGenerator('bar'));
  });

  it('should return false if a sub-generator is registered', function() {
    base.register('foo', function(app) {
      app.register('bar', function() {});
    });
   
    assert(base.hasGenerator('foo.bar'));
  });

  it('should return false if a sub-generator is not registered', function() {
    base.register('foo', function(app) {
      app.register('bar', function() {});
    });
   
    assert(!base.hasGenerator('foo.baz'));
    assert(!base.hasGenerator('foo.bar.baz'));
  });
});
