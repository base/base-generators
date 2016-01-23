'use strict';

var path = require('path');
var utils = require('./utils');

function register(options) {
  options = options || {};

  return function(app) {
    if (this.isRegistered('base-register')) return;

    /**
     * Register generator `name` with the given `fn`.
     *
     * @param {String} `name`
     * @param {Function} `fn` Generator function.
     * @return {Object} Returns the instance of Generate for chaining.
     * @api public
     */

    app.register = function(name, fn) {
      return this.generators.set(name, this.alias(name), fn, this);
    };

    /**
     * Register a generator by filepath, or try to register by
     * calling `require.resolve` on the given `name`.
     *
     * @param {String} `name`
     * @param {String} `filepath`
     * @param {Object} `env`
     * @return {Object}
     * @api public
     */

    app.registerPath = function(name, filepath, env) {
      var generator = utils.tryRequire(this.resolve(filepath));
      if (generator) {
        return this.register(name, generator, env);
      }
    };

    /**
     * Attempts to find a generator with the given `name` and `options`.
     *
     * @param {String} `name` Can be a module name or filepath of a locally or globally installed npm module.
     * @param {Object} `options`
     * @return {Object} Returns the filepath to the generator, if found.
     * @api public
     */

    app.resolve = function(name, cwd) {
      var options = { modulename: this.modulename, cwd: cwd };
      var filepath = this.resolveConfig(utils.resolve(name, options));
      if (filepath) {
        return path.resolve(filepath);
      }
    };

    /**
     * Attempts to find a generator with the given `alias` and `options`.
     *
     * @param {String} `alias` Can be a module alias or filepath of a locally or globally installed npm module.
     * @param {Object} `options`
     * @return {Object} Returns the filepath to the generator, if found.
     * @api public
     */

    app.resolveConfig = function(filepath) {
      if (typeof filepath !== 'string') return;
      var fp = path.resolve(filepath, this.configfile);
      if (utils.exists(fp)) {
        return fp;
      }
    };

    /**
     * Create a generator alias from the given `name`.
     *
     * @param {String} `name`
     * @param {Object} `options`
     * @return {String} Returns the alias.
     * @api public
     */

    app.alias = function(name, options) {
      var opts = utils.extend({}, this.options, options);
      if (typeof opts.alias === 'function') {
        return opts.alias(name);
      }
      return name.slice(name.indexOf('-') + 1);
    };

    /**
     * Define the configfile name to use for lookups.
     */

    Object.defineProperty(app, 'configfile', {
      configurable: true,
      set: function(configfile) {
        this.options.configfile = configfile;
      },
      get: function() {
        return this.options.configfile || 'generator.js';
      }
    });

    /**
     * Define the modulename to use for lookups.
     */

    Object.defineProperty(app, 'modulename', {
      configurable: true,
      set: function(modulename) {
        this.options.modulename = modulename;
      },
      get: function() {
        return this.options.modulename || 'generate';
      }
    });

    /**
     * Get the `base` instance from the current instance of `generate`.
     * @api public
     */

    Object.defineProperty(app, 'base', {
      configurable: true,
      get: function() {
        return this.parent ? this.parent.base : this;
      }
    });
  };
};

/**
 * Expose `register` plugin
 */

module.exports = register;
