'use strict';

var path = require('path');
var debug = require('debug')('base:generators:register');
var utils = require('./utils');

/**
 * Expose `register` plugin
 */

module.exports = function register(options) {
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
      return this.generators.set(name, fn, this);
    });

    /**
     * Attempts to find a generator with the given `name` and `options`.
     *
     * @name .resolve
     * @param {String} `name` Can be a module name or filepath to a module that is locally or globally installed.
     * @param {Object} `options`
     * @return {Object} Returns the filepath to the generator, if found.
     * @api public
     */

    app.define('resolve', function(name, cwd) {
      var opts = {cwd: cwd, configfile: this.configfile, modulename: this.modulename};
      var configpath = utils.resolvePath(name, opts);

      if (typeof configpath === 'undefined') {
        var fullname = utils.toFullname(name, opts);
        configpath = utils.resolvePath(fullname, opts);

        // if still not found, this probably means the module does not have
        // `main` defined in package.json, so try resolving the configfile
        // directly.
        if (typeof configpath === 'undefined') {
          configpath = this.resolveConfig(fullname, opts);
        }
      }

      if (configpath) {
        debug('resolved: %s, at: %s', name, configpath);
        return configpath;
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

    app.define('resolveConfig', function(name, options) {
      if (typeof name !== 'string') return;

      var opts = utils.extend({configfile: this.configfile}, options);
      return utils.resolveConfig(name, opts);
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
      return utils.toAlias(name, opts);
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
