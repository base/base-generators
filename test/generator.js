'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('base');
var tasks = require('base-tasks');
var generators = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname + '/fixtures');

describe('generator', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });

  describe('register', function() {
    it('should register a generator function', function() {
      base.register('foo', function() {});
    });

    it('should get a generator that was registered as a function', function() {
      base.register('foo', function(app) {
        app.task('default', function() {});
      });
      var generator = base.getGenerator('foo');
      assert(generator);
      assert(generator.tasks);
      assert(generator.tasks.hasOwnProperty('default'));
    });

    it('should register a generator by path', function() {
      base.register('a', fixtures('generators/a'));
    });

    it('should get a generator that was registered by path', function() {
      base.register('a', fixtures('generators/a'));
      var generator = base.getGenerator('a');
      assert(generator);
      assert(generator.tasks);
      assert(generator.tasks.hasOwnProperty('default'));
    });
  });
});
