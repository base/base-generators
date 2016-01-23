'use strict';

var path = require('path');
var debug = require('debug')('generate:cache');
var utils = require('./utils');

module.exports = function(options) {
  return function(app) {
    if (this.isRegistered('generator-cache')) return;

    var base = this.base;
    if (typeof this.base === 'undefined') {
      throw new Error('expected a `base` instance to be defined');
    }

    var Generate = this.constructor;
    this.generators = new Cache();
    var invoked = {};

    /**
     * Create an instance of `Cache`, used to cache references to modules
     * that can be lazily instantiated in a specific context.
     */

    function Cache() {}

    /**
     * Set generator `name` on the `app.generators` object with the given `fn`.
     *
     * @param {String} `name`
     * @param {String} `alias`
     * @param {Function|Object} `fn` Generator function or instance of `Generate`.
     * @param {Object} `parent` Optionally pass an instance to set as the "parent"
     */

    Cache.prototype.set = function(name, alias, fn, parent) {
      delete invoked[alias];

      debug('creating generator %s', name);
      if (typeof fn === 'undefined') {
        fn = name;
      }

      var generator = fn;
      if (!utils.isObject(fn) || !fn.isGenerate) {
        generator = new Generate();
      }

      generator.define('parent', parent || generator.parent || base);
      generator.isGenerator = true;

      generator.env = {};
      generator.env.alias = alias;
      generator.env.name = name;

      if (typeof fn === 'string') {
        generator.env.path = fn;

        Object.defineProperty(generator.env, 'fn', {
          configurable: true,
          enumerable: true,
          get: function() {
            try {
              return require(fn);
            } catch (err) {}

            try {
              return require(path.resolve(fn));
            } catch (err) {}
          }
        });
      } else if (typeof fn === 'function') {
        generator.env.path = null;
        generator.env.fn = fn;

      } else if (utils.isObject(fn) && fn.isGenerate) {
        generator.env.path = null;
        generator.env.fn = null;
      }

      Object.defineProperty(this, alias, {
        configurable: true,
        enumerable: true,
        set: function(val) {
          this.set(name, alias, val);
        },
        get: function() {
          return invoked[alias] || (invoked[alias] = this.invoke(generator));
        }
      });

      base.lazyGenerators(generator);
      return generator;
    };

    /**
     * Invoke the generator `fn` on the given `generator`
     * in the context of the curren instance.
     *
     * @param {Object} `generator`
     * @return {Object}
     */

    Cache.prototype.invoke = function(app) {
      if (typeof app.env.fn === 'function') {
        app.env.fn.call(app, app, base, app.env);
      }
      return app;
    };

    /**
     * Lookup generator:
     * - [x] look for registered generator using custom fn
     * - [x] look for registered generator by alias
     * - [x] look for registered generator by full name
     * - [ ] look for globally installed generator
     */

    Cache.prototype.get = function(name, fn) {
      fn = fn || utils.identity;
      return this[name]
        || this[fn(name)]
        || this[utils.toFullname(name, 'generate')];
    };
  };
};
