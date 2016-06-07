'use strict';

require('mocha');
var assert = require('assert');
var tasks = require('../lib/tasks');
var Base = require('base');
var app;

/**
 * $ gen
 * $ gen default
 * $ gen foo
 * $ gen foo:default
 * $ gen foo,bar
 * $ gen foo bar
 * $ gen foo bar:baz
 * $ gen foo:bar,baz
 * $ gen foo.bar
 * $ gen foo.bar:baz
 * $ gen foo.bar baz
 * $ gen foo.bar baz.qux
 * $ gen foo.bar:baz qux.fez:default
 */

describe('tasks', function() {
  beforeEach(function() {
    app = new Base({isApp: true});
    app.use(require('base-task')());
    app.use(require('..')());
  });

  it('should not throw an error when a task or generator is not found', function(cb) {
    try {
      tasks.parse(app, 'foo');
      cb();
    } catch (err) {
      cb(err);
    }
  });

  it('should add unresolved tasks or generators to a splat array', function() {
    var res = tasks.parse(app, 'foo');
    assert.deepEqual(res[0]._, ['foo']);
  });

  it('should detect a task', function() {
    app.task('foo', function() {});
    var res = tasks.parse(app, 'foo');
    assert.deepEqual(res, [{name: 'this', tasks: ['foo']}]);
  });

  it('should detect a default task', function() {
    app.task('default', function() {});
    var res = tasks.parse(app, 'default');
    assert.deepEqual(res, [{name: 'this', tasks: ['default']}]);
  });

  it('should detect a default generator', function() {
    app.register('default', function() {});
    var res = tasks.parse(app, 'default');
    assert.deepEqual(res, [{name: 'default', tasks: ['default']}]);
  });

  it('should detect a sub generator on the default generator', function() {
    app.register('default', function(sub) {
      sub.register('foo', function() {});
    });

    var res = tasks.parse(app, 'foo');
    assert.deepEqual(res, [{name: 'default.foo', tasks: ['default']}]);
  });

  it('should support passing an array of tasks', function() {
    app.task('foo', function() {});
    app.task('bar', function() {});
    assert.deepEqual(tasks.parse(app, ['foo']), [{name: 'this', tasks: ['foo']}]);
    assert.deepEqual(tasks.parse(app, ['foo', 'bar']), [{name: 'this', tasks: ['foo', 'bar']}]);
  });

  it('should detect comma-separated tasks', function() {
    app.task('foo', function() {});
    app.task('bar', function() {});
    app.task('baz', function() {});
    var res = tasks.parse(app, 'foo,bar,baz');
    assert.deepEqual(res, [{name: 'this', tasks: ['foo', 'bar', 'baz']}]);
  });

  it('should detect a generator', function() {
    app.register('foo', function() {});
    var res = tasks.parse(app, 'foo');
    assert.deepEqual(res, [{name: 'foo', tasks: ['default']}]);
  });

  it('should detect comma-separated generators', function() {
    app.register('foo', function() {});
    app.register('bar', function() {});
    app.register('baz', function() {});
    var res = tasks.parse(app, 'foo,bar,baz');

    assert.deepEqual(res, [
      {name: 'foo', tasks: ['default']},
      {name: 'bar', tasks: ['default']},
      {name: 'baz', tasks: ['default']}
    ]);
  });

  it('should detect sub-generators', function() {
    var res = tasks.parse(app, 'foo.bar');
    assert.deepEqual(res, [{name: 'foo.bar', tasks: ['default']}]);
  });

  it('should detect sub-generator tasks separated by colon', function() {
    var res = tasks.parse(app, 'foo.bar:baz');
    assert.deepEqual(res, [{name: 'foo.bar', tasks: ['baz']}]);
  });

  it('should detect an array of sub-generators with tasks separated by colon', function() {
    var res = tasks.parse(app, ['foo.bar:baz', 'one.two:three']);
    assert.deepEqual(res, [
      {name: 'foo.bar', tasks: ['baz']},
      {name: 'one.two', tasks: ['three']}
    ]);
  });

  it('should detect an array of sub-generators the same generators with tasks separated by colon', function() {
    var res = tasks.parse(app, ['foo.bar:baz', 'foo.bar:qux']);
    assert.deepEqual(res, [
      {name: 'foo.bar', tasks: ['baz', 'qux']}
    ]);
  });

  it('should not merge sub-generators that do not directly follow on another', function() {
    var res = tasks.parse(app, ['foo.bar:baz', 'one.two:three', 'foo.bar:qux']);
    assert.deepEqual(res, [
      {name: 'foo.bar', tasks: ['baz']},
      {name: 'one.two', tasks: ['three']},
      {name: 'foo.bar', tasks: ['qux']}
    ]);
  });

  it('should detect sub-generator tasks separated by commas', function() {
    var res = tasks.parse(app, 'foo.bar:baz,qux');
    assert.deepEqual(res, [{name: 'foo.bar', tasks: ['baz', 'qux']}]);
  });

  it('should detect sub-generator tasks as separate args', function() {
    assert.deepEqual(tasks.parse(app, 'foo.bar', 'baz'), [{name: 'foo.bar', tasks: ['baz']}]);
    assert.deepEqual(tasks.parse(app, 'foo.bar', ['baz', 'qux']), [{name: 'foo.bar', tasks: ['baz', 'qux']}]);
  });
});
