'use strict';

var path = require('path');
var debug = require('debug')('base:generators:cache');
var util = require('generator-util');
var utils = require('./utils');
var env = require('./env');
var pristine;

module.exports = function(config) {
  return function(app) {
    if (this.isRegistered('base-generators-cache')) return;

    var Generator = this.constructor;
    this.generators = new Cache();

    // caches
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

    Cache.prototype.set = function(name, fn, parent, options) {
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

      parent = parent || app.base;
      utils.define(this, 'parent', parent);
      var generator;

      if (util.isObject(fn) && fn.isGenerator) {
        generator = fn;
      } else {
        generator = new Generator();
      }

      generator.isGenerator = true;

      // merge options
      var opts = utils.extend({}, config, app.base.options, options, generator.options);
      if (opts.pristine === true) {
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
      generator.name = generator.env.name;

      // if `pristine` is defined on base.options, parent options will
      // not be merged onto "child" generators, and parent plugins will
      // not be run on "child" generators
      if (pristine !== true) {
        generator.options = opts;
        app.run(generator);
      }

      // create getter for invoking the generator instance
      Object.defineProperty(this, name, {
        configurable: true,
        enumerable: true,
        get: function() {
          if (invoked[name]) return invoked[name];
          var gen = utils.invoke(generator, opts.runInContext);
          if (gen) {
            return (invoked[name] = gen);
          }
        }
      });

      parent.emit('generator.set', generator);
      parent.emit('generator', 'set', generator);

      generator.on('error', function(err) {
        if (app.options.verbose || app.options.stack) {
          console.log(app.options.stack ? err.stack : err);
        }
        this.parent.emit('error', this.error(err, generator));
      }.bind(this));

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

    Cache.prototype.get = function(name, fn) {
      debug('generators.get getting "%s"', name);
      if (getCache[name]) return getCache[name];
      fn = fn || utils.identity;

      var alias = fn(name);
      var fullname = util.toFullname(name, {prefix: app.prefix});
      var basename = path.basename(name);
      var aliasPath = util.toGeneratorPath(alias, false);
      var namePath = util.toGeneratorPath(name, false);

      var names = [fullname, name, alias, basename, aliasPath, namePath];
      names = utils.unique(names.filter(Boolean));

      var seen = {};
      var len = names.length;
      var idx = -1;

      while (++idx < len) {
        var n = names[idx];
        debug('generators.get "%s"', n);

        if (getCache[n]) return getCache[n];
        if (seen[n]) continue;
        seen[n] = true;

        var generator = this[n] || utils.get(this, n);
        if (generator) {
          this.parent.emit('generator.get', generator);
          this.parent.emit('generator', 'get', generator);
          return set(n, generator);
        }
      }
    };

    Cache.prototype.error = function(error, generator) {
      if (error.name === 'Error') {
        return new GeneratorError(error);
      }

      if (error.name === 'TypeError') {
        return error;
      }

      if (error.name === 'SyntaxError') {
        return error;
      }

      if (error.name === 'ReferenceError') {
        return error;
      }

      if (error.name.indexOf('GeneratorError') === 0) {
        return error;
      }

      function GeneratorError(err) {
        this.message = err.message;
        this.name = 'GeneratorError';
        this.name += ': generator [' + generator.namespace + '] reason';

        var inst = this;

        Object.defineProperty(err, 'name', {
          configurable: true,
          get: function() {
            return inst.name;
          }
        });

        this.stack = err.stack;
      }

      GeneratorError.prototype = new Error();
      GeneratorError.prototype.constructor = GeneratorError;
      define(GeneratorError.prototype, 'name', function() {
        return 'GeneratorError';
      });

      GeneratorError.prototype.inspect = function() {
        if (this.message) {
          return '[' + this.constructor.name + ': ' + this.message + ']';
        }
        return '[' + this.constructor.name + ']';
      };

      function define(obj, prop, val) {
        Object.defineProperty(obj, prop, {
          configurable: true,
          set: function(val) {
            define(obj, prop, val);
          },
          get: function() {
            if (typeof val === 'function') {
              return val.call(this);
            }
            return val;
          }
        });
      }

      return new GeneratorError(error);
    };
  };
};

function toNamespace(parent, alias) {
  return (parent.namespace ? parent.namespace + '.' : '') + alias;
}

