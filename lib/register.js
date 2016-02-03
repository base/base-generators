'use strict';

var path = require('path');
var debug = require('debug')('base:generators:register');
var utils = require('generator-util');
var resolveCache = {};

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

    this.define('register', function(name, fn) {
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

    this.define('resolve', function(name, options) {
      var opts = utils.extend({ configfile: this.configfile }, options);
      var fullname = this.toFullname(name);
      var key = opts.cwd + '::' + fullname;
      if (resolveCache[key]) {
        return resolveCache[key];
      }

      debug('resolving: "%s", at cwd: "%s"', name, opts.cwd);

      var res = utils.tryResolve(fullname, opts)
        || utils.tryResolve(name, opts)
        || utils.tryResolve(path.join(fullname, this.configfile), opts);

      return (resolveCache[key] = res);
    });


    this.define('registerConfig', function(name, configfile, options) {
      var opts = utils.extend({ cwd: this.cwd }, options);

      debug('registering configfile: "%s", at cwd: "%s"', name, opts.cwd);
      var fn = utils.configfile(configfile, opts);
      return this.register(name, fn);
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
