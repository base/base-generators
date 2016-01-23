'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('base');
var gm = require('global-modules');
var generators = require('..');
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
      assert(typeof fp === 'string');
    });
    
    it('should resolve a generator path from a cwd', function() {
      assert(base.resolve('a', fixtures()));
    });

    it('should resolve a generator path from a generator name', function() {
      assert(base.resolve('a', fixtures()));
    });

    it('should resolve the path to a local config file', function() {
      var fp = base.resolve('a', fixtures());
      assert(typeof fp === 'string');
    });
  });

  describe('global', function() {
    it('should resolve a global generator path', function() {
      var fp = base.resolve('node', gm);
      assert.equal(fp, path.resolve(gm, 'generate-node/generator.js'));
    });

    it('should resolve a global generator path without a cwd', function() {
      var fp = base.resolve('node');
      assert.equal(fp, path.resolve(gm, 'generate-node/generator.js'));
    });

    it('should resolve a global generator by full name', function() {
      var fp = base.resolve('generate-node');
      assert.equal(fp, path.resolve(gm, 'generate-node/generator.js'));
    });

    it('should return undefined when a generator is not found', function() {
      var fp = base.resolve('foo-bar');
      assert.equal(typeof fp, 'undefined');
    });

    it('should return null when a generator is not found at the given cwd', function() {
      var actual = base.resolve('node', fixtures());
      assert.equal(actual, null);
    });
  });
});