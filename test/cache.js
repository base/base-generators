'use strict';

require('mocha');
var assert = require('assert');
var cache = require('../lib/cache');
var generators = require('..');
var Base = require('base');
var base;

describe('cache', function() {
  describe('plugin', function() {
    it('should work as a plugin', function() {
      base = new Base();
      base.use(cache());
      assert(base.hasOwnProperty('generators'));
    });

    it('should only register the plugin once', function(cb) {
      base = new Base();
      base.registered = {};

      var count = 0;
      base.on('plugin', function() {
        count++;
      });

      base.use(cache());
      base.use(cache());
      base.use(cache());
      base.use(cache());
      base.use(cache());
      assert.equal(count, 1);
      cb();
    });
  });

  describe('set', function() {
    beforeEach(function() {
      Base.use(generators());
      base = new Base();
    });

    it('should set an instance', function() {
      base.generators.set('foo', function() {});
      assert(base.generators.hasOwnProperty('foo'));
    });

    it('should set an instance with a parent instance', function() {
      base.generators.set('foo', function() {}, base);
      assert(base.generators.hasOwnProperty('foo'));
    });

    it('should set options from the base instance on new instances', function() {
      base = new Base({options: {a: 'b'}});
      assert.equal(base.options.a, 'b');

      base.generators.set('foo', function() {}, base);
      assert(base.generators.hasOwnProperty('foo'));
      assert.equal(base.generators.foo.options.a, 'b');
    });
  });

  describe('get', function() {
    beforeEach(function() {
      Base.use(generators());
      base = new Base();
    });

    it('should get an instance from app.generators', function() {
      base.generators.set('foo', function() {}, base);
      var foo = base.generators.get('foo');
      assert(foo);
      assert(foo.isGenerator);
    });
  });
});
