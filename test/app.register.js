'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname + '/fixtures');

describe('.register', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });
  
  describe('function', function() {
    it('should get a generator that was registered as a function', function() {
      base.register('foo', function() {});
      var foo = base.getGenerator('foo');
      assert(foo);
      assert.equal(foo.env.alias, 'foo');
    });

    it('should get a task from a generator registered as a function', function() {
      base.register('foo', function(foo) {
        foo.task('default', function() {});
      });
      var generator = base.getGenerator('foo');
      assert(generator);
      assert(generator.tasks);
      assert(generator.tasks.hasOwnProperty('default'));
    });

    it('should get a sub-generator from a generator registered as a function', function() {
      base.register('foo', function(foo) {
        base.register('bar', function(bar) {});
      });
      var bar = base.getGenerator('foo.bar');
      assert(bar);
      assert.equal(bar.env.alias, 'bar');
    });

    it('should get a sub-generator from a generator registered as a function', function() {
      base.register('foo', function(foo) {
        base.register('bar', function(bar) {
          bar.task('something', function() {});
        });
      });
      var bar = base.getGenerator('foo.bar');
      assert(bar);
      assert(bar.tasks);
      assert(bar.tasks.hasOwnProperty('something'));
    });

    it('should expose the `base` instance as the second param', function(cb) {
      base.register('foo', function(foo, base) {
        assert(base.generators.hasOwnProperty('foo'));
        cb();
      });
      base.getGenerator('foo');
    });

    it('should expose sibling generators on the `base` instance', function(cb) {
      base.register('foo', function(foo, base) {
        foo.task('abc', function() {});
      });
      base.register('bar', function(bar, base) {
        assert(base.generators.hasOwnProperty('foo'));
        assert(base.generators.hasOwnProperty('bar'));
        cb();
      });

      base.getGenerator('foo');
      base.getGenerator('bar');
    });
  });
  
  describe('path', function() {
    it('should use a custom function to create the alias', function() {
      base.option('alias', function(name) {
        return name.slice(name.lastIndexOf('-') + 1);
      });

      base.register('base-abc-xyz', function() {});
      assert(base.generators.hasOwnProperty('xyz'));
    });

    it('should get a generator that was registered by path', function() {
      base.register('a', fixtures('generators/a'));
      var generator = base.getGenerator('a');
      assert(generator);
      assert(generator.tasks);
      assert(generator.tasks.hasOwnProperty('default'));
    });

    it('should register a generator function by name', function() {
      base.register('foo', function() {});
      assert(base.generators.hasOwnProperty('foo'));
    });

    it('should register a generator function by alias', function() {
      base.register('base-abc', function() {});
      assert(base.generators.hasOwnProperty('abc'));
    });

    it('should register a generator by path', function() {
      base.register('a', fixtures('generators/a'));
      assert(base.generators.hasOwnProperty('a'));
    });

    it('should register a generator from a configfile filepath', function() {
      base.register('base-abc', fixtures('generators/a/generator.js'));
      assert(base.generators.hasOwnProperty('abc'));
    });
  });

  describe('instance', function() {
    it('should register an instance', function() {
      base.register('base-inst', new Base());
      assert(base.generators.hasOwnProperty('inst'));
    });

    it('should get a generator that was registered as an instance', function() {
      var foo = new Base();
      foo.task('default', function() {});
      base.register('foo', foo);
      assert(base.getGenerator('foo'));
    });

    it('should register multiple instances', function() {
      var foo = new Base();
      var bar = new Base();
      var baz = new Base();
      base.register('foo', foo);
      base.register('bar', bar);
      base.register('baz', baz);
      assert(base.getGenerator('foo'));
      assert(base.getGenerator('bar'));
      assert(base.getGenerator('baz'));
    });

    it('should get tasks from a generator that was registered as an instance', function() {
      var foo = new Base();
      foo.task('default', function() {});
      base.register('foo', foo);
      var generator = base.getGenerator('foo');
      assert(generator.tasks);
      assert(generator.tasks.hasOwnProperty('default'));
    });

    it('should get sub-generators from a generator registered as an instance', function() {
      var foo = new Base();
      foo.register('bar', function() {});
      base.register('foo', foo);
      var generator = base.getGenerator('foo.bar');
      assert(generator);
    });

    it('should get tasks from sub-generators registered as an instance', function() {
      var foo = new Base();
      foo.register('bar', function(bar) {
        bar.task('whatever', function() {});
      });
      base.register('foo', foo);
      var generator = base.getGenerator('foo.bar');
      assert(generator.tasks);
      assert(generator.tasks.hasOwnProperty('whatever'));
    });
  });
});
