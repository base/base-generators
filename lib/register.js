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
    if (this.isRegistered('base-generators-register')) return;

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
      debug('registering: "%s"', name);
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
      debug('resolving: "%s", at cwd: "%s"', name, cwd);

      var opts = {cwd: cwd, configfile: this.configfile, modulename: this.modulename};
      var modulename = utils.toFullname(name, opts);
      var configfile = path.join(modulename, this.configfile);

      return utils.tryResolve(name, opts)
        || utils.tryResolve(modulename, opts)
        || utils.tryResolve(configfile, opts);
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
