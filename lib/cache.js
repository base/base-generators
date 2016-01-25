'use strict';

var path = require('path');
var debug = require('debug')('base:generators:cache');
var utils = require('./utils');
var env = require('./env');

module.exports = function(options) {
  return function(app) {
    if (this.isRegistered('generator-cache')) return;

    var base = this.base;
    if (typeof this.base === 'undefined') {
      throw new Error('expected a `base` instance to be defined');
    }

    var Generator = this.constructor;
    this.generators = new Cache();
    var invoked = {};

    /**
     * Create an instance of `Cache`. Caches references to modules
     * so they can be lazily invoked in a specific context.
     */

    function Cache() {}

    /**
     * Set generator `name` with the given `fn`.
     *
     * @param {String} `name`
     * @param {String} `alias`
     * @param {Function|Object} `fn` Generator function or instance of `Generator`.
     * @param {Object} `parent` Optionally pass an instance to set as the "parent"
     */

    Cache.prototype.set = function(name, alias, fn, parent) {
      debug('setting generator %s', name);
      delete invoked[alias];

      if (typeof fn === 'undefined') {
        fn = name;
      }

      var generator;
      if (utils.isObject(fn) && fn.isGenerator) {
        generator = fn;
      } else {
        generator = new Generator();
      }

      generator.define('parent', parent || generator.parent || base);
      generator.isGenerator = true;
      generator.use(env());
      generator.createEnv(name, alias, fn);
      generator.name = alias;

      Object.defineProperty(this, alias, {
        configurable: true,
        enumerable: true,
        set: function(val) {
          this.set(name, alias, val);
        },
        get: function o() {
          return invoked[alias] || (invoked[alias] = this.invoke(generator));
        }
      });

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
        debug('invoking: %s', app.env.alias);
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
      debug('getting: %s', name);
      fn = fn || utils.identity;

      return this[name]
        || this[fn(name)]
        || this[utils.toFullname(name, 'generate')];
    };
  };
};
