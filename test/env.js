'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('base');
var tasks = require('base-tasks');
var generators = require('..');
var base;

describe('env', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });

  describe('cwd', function() {
    it('should get the current working directory', function() {
      assert.equal(base.cwd, process.cwd());
    });

    it('should set the current working directory', function() {
      base.cwd = 'test/fixtures';
      assert.equal(base.cwd, path.join(process.cwd(), 'test/fixtures'));
    });
  });
});
