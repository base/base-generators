'use strict';

var path = require('path');
var debug = require('debug')('base:generators:cache');
var util = require('generator-util');
var utils = require('./utils');
var env = require('./env');
var pristine;

module.exports = function(config) {
  return function(app) {
    if (this.isRegistered('generator-cache')) return;

    var Generator = this.constructor;
    this.generators = {};

    var base = this.base;
    var envCache = {};
    var getCache = {};
    var invoked = {};

    function set(prop, val) {
      getCache[prop] = val;
      return val;
    }

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

    this.generators.set = function(name, fn, parent) {
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

      generator.isGenerator = true;

      // merge options
      var opts = utils.extend({}, config, parent.options, generator.options);
      if (opts.pristing === true) {
        pristine = true;
      }

      // ensure the `env` plugin is registered on the generator
      generator.use(env(opts));

      // set `parent` on the generator instance
      generator.define('parent', parent);

      // create `generator.env` object
      if (envCache[name]) {
        generator.env = envCache[name];
      } else {
        generator.createEnv(name, opts, fn);
      }

      // create alias
      var alias = generator.env.alias;
      generator.namespace = toNamespace(parent, alias);

      // create getter for invoking the generator instance
      Object.defineProperty(this, alias, {
        configurable: true,
        enumerable: true,
        get: function() {
          if (invoked[alias]) return invoked[alias];
          var app = utils.invoke(generator);
          if (app) {
            return (invoked[alias] = app);
          }
        }
      });

      // if `pristine` is defined on base.options, parent options will
      // not be merged onto "child" generators, and parent plugins will
      // not be run on "child" generators
      if (pristine !== true) {
        generator.options = opts;
        parent.run(generator);
      }

      envCache[name] = generator.env;
      return generator;
    };

    /**
     * Find a registered generator by searching the following:
     *   1. look for registered generator by given `name`
     *   2. look for registered generator by alias
     *   3. look for registered generator by full name
     *   4. look for registered generator by basename
     *   5. look for registered generator by alias dot-notation path
     *   6. look for registered generator by full name dot-notation path
     */

    this.generators.get = function(name, fn) {
      debug('generators.get getting "%s"', name);
      fn = fn || utils.identity;

      var alias = fn(name);
      var fullname = util.toFullname(name, {prefix: app.prefix});
      var basename = path.basename(name);
      var aliasPath = util.toGeneratorPath(alias, false);
      var namePath = util.toGeneratorPath(name, false);

      var names = [name, alias, fullname, basename, aliasPath, namePath];
      names = utils.unique(names.filter(Boolean));

      var seen = {};
      var len = names.length;
      var idx = -1;

      while (++idx < len) {
        var n = names[idx];
        debug('generators.get "%s"', n);

        if (getCache[n]) {
          return getCache[n];
        }

        if (seen[n]) {
          continue;
        }
        seen[n] = true;

        var generator = this[n] || utils.get(this, n);
        if (generator) {
          return set(n, generator);
        }
      }
    };
  };
};

function toNamespace(parent, alias) {
  return (parent.namespace ? parent.namespace + '.' : '') + alias;
}
