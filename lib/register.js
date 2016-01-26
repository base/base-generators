'use strict';

var path = require('path');
var debug = require('debug')('base:generators:register');
var utils = require('./utils');

function register(options) {
  options = options || {};

  return function(app) {
    if (this.isRegistered('base-register')) return;

    /**
     * Register generator `name` with the given `fn`.
     *
     * ```js
     * base.register('foo', function(app, base) {
     *   // "app" is a private instance created for the generator
     *   // "base" is a shared instance
     * });
     * ```
     * @name .register
     * @param {String} `name`
     * @param {Function} `fn` Generator function or instance
     * @return {Object} Returns the generator instance.
     * @api public
     */

    app.define('register', function(name, fn) {
      this.emit('register', name);
      return this.generators.set(name, this.alias(name), fn, this);
    });

    /**
     * Attempts to find a generator with the given `name` and `options`.
     *
     * @name .resolve
     * @param {String} `name` Can be a module name or filepath of a locally or globally installed npm module.
     * @param {Object} `options`
     * @return {Object} Returns the filepath to the generator, if found.
     * @api public
     */

    app.define('resolve', function(name, cwd) {
      var options = { modulename: this.modulename, cwd: cwd };
      var filepath = this.resolveConfig(utils.resolve(name, options));
      if (filepath) {
        debug('resolved: %s, at: %s', name, filepath);
        return path.resolve(filepath);
      }
    });

    /**
     * Attempts to find a generator with the given `alias` and `options`.
     *
     * @name .resolveConfig
     * @param {String} `alias` Can be a module alias or filepath of a locally or globally installed npm module.
     * @param {Object} `options`
     * @return {Object} Returns the filepath to the generator, if found.
     * @api public
     */

    app.define('resolveConfig', function(filepath) {
      if (typeof filepath !== 'string') return;
      var fp = path.resolve(filepath, this.configfile);

      if (utils.exists(fp)) {
        debug('resolved config: %s, at %s', this.configfile, fp);
        return fp;
      }
    });

    /**
     * Create a generator alias from the given `name`.
     *
     * @name .alias
     * @param {String} `name`
     * @param {Object} `options`
     * @return {String} Returns the alias.
     * @api public
     */

    app.define('alias', function(name, options) {
      var opts = utils.extend({}, this.options, options);
      if (typeof opts.alias === 'function') {
        return opts.alias(name);
      }
      return name.slice(name.indexOf('-') + 1);
    });

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
