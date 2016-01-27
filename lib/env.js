'use strict';

var debug = require('debug')('base:generators:env');
var utils = require('./utils');

module.exports = function(config) {
  var paths = {};

  return function(app) {
    if (this.isRegistered('base-generators-env')) return;

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
      if (!this.env) this.env = {};

      this.env.alias = utils.toAlias(name, opts);
      this.env.name = utils.toFullname(this.env.alias, {
        modulename: this.modulename || 'generate'
      });

      this.name = this.env.alias;

      debug('createEnv · name: "%s", alias: "%s"', name, this.env.alias);

      if (typeof fn === 'string') {
        this.env.path = this.resolve(fn);

        if (typeof this.env.path === 'undefined') {
          throw new Error('cannot find generator: ' + fn);
        }

        Object.defineProperty(this.env, 'fn', {
          configurable: true,
          enumerable: true,
          get: function() {
            return paths[this.path] || (paths[this.path] = utils.tryRequire(this.path));
          }
        });

      } else if (typeof fn === 'function') {
        this.env.path = undefined;
        this.env.fn = fn;
      }

      debug('created: %j', this.env);
      return this.env;
    });
  };
};
