'use strict';

var path = require('path');
var utils = require('generator-util');
var debug = require('debug')('base:generators:env');
var cache = {};

module.exports = function(config) {
  var paths = {};

  return function(app) {
    if (this.isRegistered('base-generators-env')) return;
    this.env = this.env || {};

    /**
     * Create an `env` object for a generator with the given `fn`.
     *
     * - If `fn` is a filepath, the path will be resolved and validated, but not required, allowing it to be lazily invoked later.
     * - If `fn` is a function, it will be lazily invoked when the generator is called.
     *
     * @param {String} `name` The name, alias or path of the generator.
     * @param {Object|Function|String} `options` Options, path or generator function.
     * @param {Object|String} `fn` Generator function or path.
     * @return {Object}
     */

    this.define('createEnv', function(name, options, fn) {
      if (!utils.isObject(options)) {
        fn = options;
        options = {};
      }

      var opts = utils.extend({}, config, this.options, options);
      this.env = this.env || {};
      var env = this.env;

      if (!opts.prefix && !opts.modulename) {
        opts.prefix = this.prefix || 'generate';
      }

      env.options = opts;
      env.configfile = this.configfile;

      if (typeof fn === 'string') {
        envPath(this, name, env, opts, fn);

      } else if (typeof fn === 'function') {
        envFn(this, name, env, opts, fn);

      } else if (utils.isObject(fn) && fn.isGenerator) {
        envFn(this, name, env, opts, fn);
      }

      debug('created: %j', env);
      cache[name] = env;
      return env;
    });
  };

  function envPath(app, name, env, opts, fn) {
    env.path = fn;

    if (!utils.isAbsolute(env.path)) {
      env.path = utils.tryResolve(fn, { configfile: app.configfile });
    }

    if (typeof env.path === 'undefined' || !utils.exists(env.path)) {
      throw new Error('cannot find generator: ' + fn);
    }

    env.alias = utils.toAlias(name, opts);
    env.name = utils.toFullname(env.alias, opts);
    createPaths(app, name, env, opts);

    define(env, 'cwd', function() {
      return path.dirname(env.path);
    });

    define(env, 'templates', function() {
      return path.resolve(env.cwd, 'templates');
    });

    define(env, 'fn', function() {
      if (paths[env.path]) return paths[env.path];

      if (utils.isObject(fn)) {
        paths[env.path] = fn;
        return fn;
      }

      var fn = utils.tryRequire(env.path) || utils.tryRequire(env.cwd);
      if (fn) {
        paths[env.path] = fn;
        return fn;
      }
    });
  }

  function envFn(app, name, env, opts, fn) {
    env.alias = name;
    env.name = name;
    env.path = undefined;
    env.fn = fn;
    createPaths(app, name, env, opts);
  }

  function createPaths(app, name, env, opts) {
    if (typeof opts.alias === 'function') {
      env.alias = opts.alias(name, opts);
    }
    app.name = env.alias;
    debug('createEnv · name: "%s", alias: "%s"', env.name, env.alias);
  }
};

function define(obj, prop, fn) {
  Object.defineProperty(obj, prop, {
    configurable: true,
    enumerable: true,
    set: function(val) {
      define(obj, prop, val);
    },
    get: function() {
      return fn();
    }
  });
}
