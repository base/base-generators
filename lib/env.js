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
     * - If `fn` is a fucntion, it will be lazily invoked when the generator is called.
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
      env.alias = utils.toAlias(name, opts);
      env.name = utils.toFullname(env.alias, opts);
      this.name = env.alias;

      debug('createEnv · name: "%s", alias: "%s"', env.name, env.alias);

      if (typeof fn === 'string') {
        env.path = utils.tryResolve(fn, {configfile: this.configfile});
        if (typeof env.path === 'undefined') {
          throw new Error('cannot find generator: ' + fn);
        }

        define(env, 'cwd', function() {
          return path.dirname(env.path);
        });

        define(env, 'templates', function() {
          return path.resolve(env.cwd, 'templates');
        });

        define(env, 'fn', function() {
          if (paths[env.path]) return paths[env.path];
          var fn = utils.tryRequire(env.path) || utils.tryRequire(env.cwd);
          if (fn) {
            paths[env.path] = fn;
            return fn;
          }
        });

      } else if (typeof fn === 'function') {
        env.path = undefined;
        env.fn = fn;
      }

      debug('created: %j', env);
      cache[name] = env;
      return env;
    });
  };
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
