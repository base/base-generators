'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var gm = require('global-modules');
var generators = require('..');
var Base = require('base');
var base;

var fixtures = path.resolve.bind(path, __dirname, 'fixtures/generators');

describe('.resolve', function() {
  beforeEach(function() {
    base = new Base();
    base.use(generators());
  });

  describe('method', function() {
    it('should expose a `resolve` method', function() {
      assert.equal(typeof base.resolve, 'function');
    });
  });

  describe('local', function() {
    it('should resolve a local generator path', function() {
      var fp = base.resolve(fixtures('a'));
      assert.equal(typeof fp, 'string');
    });
    
    it('should resolve a generator path from a cwd', function() {
      assert(base.resolve('a', fixtures()));
    });

    it('should resolve a generator path from a generator name', function() {
      assert(base.resolve('a', fixtures()));
    });

    it('should resolve the path to a local config file', function() {
      var fp = base.resolve('a', fixtures());
      assert.equal(typeof fp, 'string');
    });
  });

  describe('global', function() {
    it('should resolve a global generator path', function() {
      var fp = base.resolve('bar', gm);
      assert.equal(fp, path.resolve(gm, 'generate-bar/index.js'));
    });

    it('should resolve a global generator path without a cwd', function() {
      var fp = base.resolve('bar');
      assert.equal(fp, path.resolve(gm, 'generate-bar/index.js'));
    });

    it('should resolve a global generator by full name', function() {
      var fp = base.resolve('generate-bar');
      assert.equal(fp, path.resolve(gm, 'generate-bar/index.js'));
    });

    it('should return undefined when a generator is not found', function() {
      var fp = base.resolve('foo-bar');
      assert.equal(typeof fp, 'undefined');
    });

    it('should return undefined when a generator is not found at the given cwd', function() {
      var actual = base.resolve('bar', fixtures());
      assert.equal(typeof actual, 'undefined');
    });
  });
});
