'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var tasks = require('../lib/tasks');
var generators = require('..');
var base;

describe('.tasks plugin', function() {
  it('should register as a plugin', function() {
    Base.use(generators());
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
    Base.use(generators());
    base = new Base();
  });

  describe('hasTask', function() {
    it('should return true if a task exists', function() {
      base.task('foo', function() {});
      assert(base.hasTask('foo'));
    });

    it('should return false if a task does not exist', function() {
      base.task('foo', function() {});
      assert(!base.hasTask('bar'));
    });
  });

  describe('.stringifyTasks', function() {
    it('should create a generator-task string', function() {
      assert.equal(base.stringifyTasks('foo'), 'foo');
      assert.equal(base.stringifyTasks('foo', function() {}), 'foo');
      assert.equal(base.stringifyTasks('foo', []), 'foo');
      assert.equal(base.stringifyTasks('foo:a,b,c'), 'foo:a,b,c');
      assert.equal(base.stringifyTasks('foo.bar:a,b,c'), 'foo.bar:a,b,c');
      assert.equal(base.stringifyTasks('foo.bar', 'a,b,c'), 'foo.bar:a,b,c');
      assert.equal(base.stringifyTasks('foo', 'a,b,c'), 'foo:a,b,c');
      assert.equal(base.stringifyTasks('foo', ['a', 'b', 'c']), 'foo:a,b,c');
      assert.equal(base.stringifyTasks(['foo', 'bar'], ['a', 'b']), 'foo.bar:a,b');
      assert.equal(base.stringifyTasks(['foo', 'bar'], 'a,b,c'), 'foo.bar:a,b,c');
    });
  });
});