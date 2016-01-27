'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var utils = require('../lib/utils');
var base;

describe('utils', function() {
  describe('.toTasks', function() {
    it('should create a generator-task string', function() {
      assert.equal(utils.toTasks('foo'), 'foo');
      assert.equal(utils.toTasks('foo', function() {}), 'foo');
      assert.equal(utils.toTasks('foo', []), 'foo');
      assert.equal(utils.toTasks('foo:a,b,c'), 'foo:a,b,c');
      assert.equal(utils.toTasks('foo.bar:a,b,c'), 'foo.bar:a,b,c');
      assert.equal(utils.toTasks('foo.bar', 'a,b,c'), 'foo.bar:a,b,c');
      assert.equal(utils.toTasks('foo', 'a,b,c'), 'foo:a,b,c');
      assert.equal(utils.toTasks('foo', ['a', 'b', 'c']), 'foo:a,b,c');
      assert.equal(utils.toTasks(['foo', 'bar'], ['a', 'b']), 'foo.bar:a,b');
      assert.equal(utils.toTasks(['foo', 'bar'], 'a,b,c'), 'foo.bar:a,b,c');
    });
  });
});
