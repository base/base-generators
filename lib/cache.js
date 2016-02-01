'use strict';

var path = require('path');
var debug = require('debug')('base:generators:cache');
var util = require('generator-util');
var utils = require('./utils');
var env = require('./env');

module.exports = function(options) {
  return function(app) {
    if (this.isRegistered('generator-cache')) return;

    var Generator = this.constructor;
    this.generators = new Cache();
    var base = this.base;
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

    Cache.prototype.set = function(name, fn, parent) {
      debug('setting generator "%s"', name);
      delete invoked[alias];

      // if `fn` is an empty object, we'll assume it's a
      // generator that doesn't expose the instance
      if (util.isObject(fn) && Object.keys(fn).length === 0) {
        throw new Error('generator instances must be exposed with module.exports');
      }

      if (typeof fn === 'undefined') {
        fn = name;
      }

      parent = parent || base;
      var generator;

      if (util.isObject(fn) && fn.isGenerator) {
        generator = fn;
      } else {
        generator = new Generator();
      }

      // ensure the `env` plugin is registered on the generator
      generator.use(env());

      generator.define('parent', parent);
      generator.isGenerator = true;
      generator.createEnv(name, base.options, fn);
      var alias = generator.env.alias;

      generator.namespace = (parent.namespace ? parent.namespace + '.' : '') + alias;

      Object.defineProperty(this, alias, {
        configurable: true,
        enumerable: true,
        get: function() {
          return invoked[alias] || (invoked[alias] = utils.invoke(generator));
        }
      });

      return generator;
    };

    /**
     * Lookup generator:
     * - [x] look for registered generator using custom fn
     * - [x] look for registered generator by alias
     * - [x] look for registered generator by full name
     * - [ ] look for globally installed generator
     */

    Cache.prototype.get = function(name, fn) {
      debug('getting: "%s"', name);
      fn = fn || utils.identity;

      var generator = utils.get(this, name);

      if (typeof generator === 'undefined' && util.exists(name)) {
        var basename = path.basename(name);
        base.register(basename, name);
        generator = utils.get(this, basename);
      }

      return generator
        || utils.get(this, util.toGeneratorPath(name, false))
        || utils.get(this, util.toGeneratorPath(fn(name), false));
    };
  };
};
