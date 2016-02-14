'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

describe('base-generators', function() {
  describe('plugin', function() {
    it('should register as a plugin on `base`', function() {
      base = new Base();
      base.use(generators());
      assert.equal(base.isRegistered('base-generators'), true);
    });

    it('should only register the plugin once', function(cb) {
      base = new Base();
      base.registered = {};

      var count = 0;
      base.on('plugin', function(name) {
        if (name === 'base-generators') {
          count++;
        }
      });

      base.use(generators());
      base.use(generators());
      base.use(generators());
      base.use(generators());
      base.use(generators());
      assert.equal(count, 1);
      cb();
    });
  });

  describe('cwd', function() {
    beforeEach(function() {
      Base.use(generators());
      base = new Base();
    });

    it('should get the current working directory', function() {
      assert.equal(base.cwd, process.cwd());
    });

    it('should set the current working directory', function() {
      base.cwd = 'test/fixtures';
      assert.equal(base.cwd, path.join(process.cwd(), 'test/fixtures'));
    });
  });
});
