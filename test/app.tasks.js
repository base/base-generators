'use strict';

require('mocha');
var assert = require('assert');
var isApp = require('./support/is-app');
var Base = require('base');
var tasks = require('../lib/tasks');
var generators = require('..');
var base;

describe('.tasks plugin', function() {
  it('should register as a plugin', function() {
    Base.use(tasks());
    var base = new Base();
    assert(base.registered.hasOwnProperty('base-generators-tasks'));
  });

  it('should only register as a plugin once', function(cb) {
    base = new Base();
    base.registered = {};

    var count = 0;
    base.on('plugin', function() {
      count++;
    });

    base.use(tasks());
    base.use(tasks());
    base.use(tasks());
    base.use(tasks());
    base.use(tasks());
    assert.equal(count, 1);
    cb();
  });
});

describe('tasks', function() {
  beforeEach(function() {
    Base.use(isApp());
    Base.use(generators());
    base = new Base();
  });

  describe('hasTask', function() {
    it('should return true if a task exists', function() {
      base.task('foo', function() {});
      assert(base.hasTask('foo'));
    });

    it('should return false if a task does not exist', function() {
      assert(!base.hasTask('bar'));
    });
  });

  describe('hasGenerator', function() {
    it('should return true if a task exists', function() {
      base.register('foo', function() {});
      assert(base.getGenerator('foo'));
    });

    it('should return false if a task does not exist', function() {
      assert(!base.getGenerator('bar'));
    });
  });
});
