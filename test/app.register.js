'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('base');
var option = require('base-option');
var generators = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname + '/fixtures');

describe('.register', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
    base.use(option());
  });

  describe('configfile', function() {
    it('should expose a configfile getter/setter', function() {
      assert.equal(typeof base.configfile, 'string');
    });

    it('should set configfile to generator.js by default', function() {
      assert.equal(base.configfile, 'generator.js');
    });

    it('should set configfile', function() {
      base.configfile = 'foo.js';
      assert.equal(base.configfile, 'foo.js');
    });
  });

  describe('configname', function() {
    it('should expose a configname getter/setter', function() {
      assert.equal(typeof base.configname, 'string');
    });

    it('should set configname to generator by default', function() {
      assert.equal(base.configname, 'generator');
    });

    it('should set configname', function() {
      base.configname = 'foo';
      assert.equal(base.configname, 'foo');
    });
  });

  describe('configpath', function() {
    it('should expose a configpath getter/setter', function() {
      assert.equal(typeof base.configpath, 'string');
    });

    it('should use configfile as basename of configpath', function() {
      base.cwd = __dirname;
      base.configfile = 'whatever.js';
      assert.equal(path.basename(base.configpath), 'whatever.js');
    });

    it('should resolve configpath from app.cwd and app.configfile', function() {
      base.cwd = __dirname;
      base.configfile = 'whatever.js';
      assert.equal(base.configpath, path.resolve(__dirname, base.configfile));
    });
  });

  describe('function', function() {
    it('should get a generator registered as a function', function() {
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
        foo.register('bar', function(bar) {});
      });
      var bar = base.getGenerator('foo.bar');
      assert(bar);
      assert.equal(bar.env.alias, 'bar');
    });

    it('should get a nested sub-generator from a generator registered as a function', function() {
      base.register('foo', function(foo) {
        foo.register('bar', function(bar) {
          bar.task('something', function() {});
        });
      });

      var bar = base.getGenerator('foo.bar');
      assert(bar);
      assert(bar.tasks);
      assert(bar.tasks.hasOwnProperty('something'));
    });

    it('should get a deeply-nested sub-generator registered as a function', function() {
      base.register('foo', function(foo) {
        foo.register('bar', function(bar) {
          bar.register('baz', function(baz) {
            baz.register('qux', function(qux) {
              qux.task('qux-one', function() {});
            });
          });
        });
      });

      var qux = base.getGenerator('foo.bar.baz.qux');
      assert(qux);
      assert(qux.tasks);
      assert(qux.tasks.hasOwnProperty('qux-one'));
    });

    it('should expose the instance from each generator', function() {
      base.register('foo', function(foo) {
        foo.register('bar', function(bar) {
          bar.register('baz', function(baz) {
            baz.register('qux', function(qux) {
              qux.task('qux-one', function() {});
            });
          });
        });
      });

      var qux = base
        .getGenerator('foo')
        .getGenerator('bar')
        .getGenerator('baz')
        .getGenerator('qux');

      assert(qux);
      assert(qux.tasks);
      assert(qux.tasks.hasOwnProperty('qux-one'));
    });

    it('should fail when a generator that does not exist is defined', function() {
      base.register('foo', function(foo) {
        foo.register('bar', function(bar) {
          bar.register('baz', function(baz) {
            baz.register('qux', function(qux) {
            });
          });
        });
      });

      var fez = base.getGenerator('foo.bar.fez');
      assert.equal(typeof fez, 'undefined');
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

  describe('alias', function() {
    it('should use a custom function to create the alias', function() {
      base.option('alias', function(name) {
        return name.slice(name.lastIndexOf('-') + 1);
      });

      base.register('base-abc-xyz', function() {});
      assert(base.generators.hasOwnProperty('base-abc-xyz'));
      assert.equal(base.generators['base-abc-xyz'].env.alias, 'xyz');
    });
  });

  describe('path', function() {
    it('should register a generator function by name', function() {
      base.register('foo', function() {});
      assert(base.generators.hasOwnProperty('foo'));
    });

    it('should register a generator function by alias', function() {
      base.register('abc', function() {});
      assert(base.generators.hasOwnProperty('abc'));
    });

    it('should register a generator by dirname', function() {
      base.register('a', fixtures('generators/a'));
      assert(base.generators.hasOwnProperty('a'));
    });

    it('should register a generator from a configfile filepath', function() {
      base.register('base-abc', fixtures('generators/a/generator.js'));
      assert(base.generators.hasOwnProperty('base-abc'));
    });

    it('should throw when a generator does not expose the instance', function(cb) {
      try {
        base.register('not-exposed', require(fixtures('not-exposed.js')));
        cb(new Error('expected an error'));
      } catch (err) {
        assert.equal(err.message, 'generator instances must be exposed with module.exports');
        cb();
      }
    });
  });

  describe('options.runInContext', function() {
    it('should register a generator and invoke it in the context of another generator', function() {
      base.register('foo', new Base());
      var foo = base.getGenerator('foo');
      foo.task('abc', function() {});

      base.register('bar', function() {}, { runInContext: foo });
      var bar = base.getGenerator('bar');

      assert(bar.tasks.hasOwnProperty('abc'));
    });
  });

  describe('instance', function() {
    it('should register an instance', function() {
      base.register('base-inst', new Base());
      assert(base.generators.hasOwnProperty('base-inst'));
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
