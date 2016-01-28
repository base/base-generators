'use strict';

var path = require('path');
var debug = require('debug')('base:generators:register');
var utils = require('generator-util');

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
     * ```js
     * // resolve by generator "alias"
     * app.resolve('foo');
     *
     * // resolve by generator name
     * app.resolve('generate-foo');
     *
     * // resolve by filepath
     * app.resolve('./a/b/c/');
     * ```
     * @name .resolve
     * @param {String} `name` Can be a module name or filepath to a module that is locally or globally installed.
     * @param {Object} `options`
     * @return {Object} Returns the filepath to the generator, if found.
     * @api public
     */

    app.define('resolve', function(name, cwd) {
      debug('resolving: "%s", at cwd: "%s"', name, cwd);

      var opts = {cwd: cwd, configfile: this.configfile, prefix: this.modulename};
      var modulename = utils.toFullname(name, opts);

      return utils.tryResolve(name, opts)
        || utils.tryResolve(modulename, opts)
        || utils.tryResolve(path.join(modulename, this.configfile), opts);
    });

    /**
     * Getter/setter for defining the `configfile` name to use for lookups.
     * By default `configfile` is set to `generator.js`.
     *
     * @name .configfile
     * @api public
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
     * Getter/setter for defining the `modulename` name to use for lookups.
     * By default `modulename` is set to `generate`.
     *
     * @name .modulename
     * @api public
     */

    Object.defineProperty(app, 'modulename', {
      configurable: true,
      set: function(modulename) {
        this.options.modulename = modulename;
      },
      get: function() {
        return this.options.modulename || this.options.prefix || 'generate';
      }
    });

    /**
     * Getter/setter for the `base` (or shared) instance of `generate`.
     *
     * When a generator is registered, the current instance (`this`) is
     * passed as the "parent" instance to the generator. The `base` getter
     * ensures that the `base` instance is always the _first instance_.
     *
     * ```js
     * app.register('foo', function(app, base) {
     *   // "app" is a private instance created for "foo"
     *   // "base" is a shared instance, also accessible using `app.base`
     * });
     * ```
     * @name .base
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
