'use strict';

require('mocha');
var assert = require('assert');
var utils = require('../lib/utils');

describe('utils', function() {
  describe('.toAlias', function() {
    it('should create an alias from a name with a dash', function() {
      assert.equal(utils.toAlias('foo-bar'), 'bar');
    });

    it('should create an alias using the given prefix', function() {
      assert.equal(utils.toAlias('foo-bar', {prefix: 'f'}), 'oo-bar');
    });

    it('should create an alias using the given alias function', function() {
      var alias = utils.toAlias('one-two-three', {
        alias: function(name) {
          return name.slice(name.lastIndexOf('-') + 1);
        }
      });
      assert.equal(alias, 'three');
    });
  });

  describe('.toGeneratorPath', function() {
    it('should create an object path for getting a generator', function() {
      var actual = utils.toGeneratorPath('a.b.c');
      assert.equal(actual, 'generators.a.generators.b.generators.c');
    });

    it('should not double-prefix the path with `generators`', function() {
      var actual = utils.toGeneratorPath('generators.a.b.c');
      assert.equal(actual, 'generators.a.generators.b.generators.c');
    });

    it('should not duplicate `generators` paths', function() {
      var actual = utils.toGeneratorPath('generators.a.generators.b.c');
      assert.equal(actual, 'generators.a.generators.b.generators.c');
    });

    it('should return `null` when a filepath with slashes is passed', function() {
      var actual = utils.toGeneratorPath('generators/foo/bar.js');
      assert.equal(actual, null);
    });
  });
});
