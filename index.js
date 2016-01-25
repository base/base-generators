/*!
 * base-generators <https://github.com/jonschlinkert/base-generators>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var debug = require('debug')('base:generators');
var register = require('./lib/register');
var tasks = require('./lib/tasks');
var cache = require('./lib/cache');
var utils = require('./lib/utils');
var env = require('./lib/env');

/**
 * Expose `generators`
 */

module.exports = function generators(options) {
  return function(app) {
    if (this.isRegistered('base-generators')) return;
    this.isGenerator = true;

    /**
     * Add plugins necessary for running generators.
     * Plugins will only be registered once.
     */

    this.define('lazyGenerators', function(app) {
      if (!app.hasGenerators) {
        app.define('hasGenerators', true);
        app.use(env());
        app.use(register(options));
        app.use(utils.option());
        app.use(utils.task());
        app.use(utils.cwd());
        app.use(tasks());
        app.use(cache(options));
      }
    });

    /**
     * Invoke generator `name` with the given `fn`.
     *
     * ```js
     * base.generate('foo', ['default'] function(err) {
     *   if (err) throw err;
     * });
     * ```
     * @name .generate
     * @emits `generate` with the generator `name` and the array of `tasks` that are queued to run.
     * @param {String} `name`
     * @param {Function} `fn` Generator function.
     * @return {Object} Returns the instance of Generate for chaining.
     * @api public
     */

    this.define('generate', function(name, tasks, cb) {
      if (typeof tasks === 'function') {
        cb = tasks;
      }

      var res = this.getTasks(name, tasks);
      if (!res.generator || typeof res.generator.env === 'undefined') {
        if (this.tasks[name]) return this.build(name, cb);
        throw new Error('cannot find generator or task: ' + name);
      }

      debug('running tasks %s', res.tasks.join(', '));
      this.emit('generate', res.generator.env.alias, res.tasks);
      return res.generator.build(res.tasks, cb);
    });

    /**
     * Get generator `name` from `app.generators`. Dot-notation
     * may be used to get a sub-generator.
     *
     * ```js
     * app.getGenerator('foo');
     *
     * // get a sub-generator
     * app.getGenerator('foo.bar.baz');
     * ```
     * @name .getGenerator
     * @param {String} `name` Generator name.
     * @return {Object|undefined} Returns the generator or undefined.
     * @api public
     */

    this.define('getGenerator', function(name) {
      debug('getting generator: %s', name);
      if (name.charAt(0) === '.') {
        name = path.resolve(name);
      }

      var fn = this.alias.bind(this);
      var names = name.split('.');
      var app = this;

      while ((name = names.shift())) {
        app = app.generators.get(name, fn);

        // if generator was not found, try again with `base`
        if (typeof app === 'undefined') {
          app = this.base.generators.get(name);
          break;
        }
      }
      return app;
    });

    /**
     * Get generator `name`, or register generator `name` with the
     * given `fn`.
     *
     * ```js
     * base.generator('foo', function(app, base) {
     *   // "app" is a private instance created for the generator
     *   // "base" is a shared instance
     * });
     * ```
     * @name .generator
     * @param {String} `name`
     * @param {Function|Object} `fn` Generator function or instance. When `fn` is defined, this method is just a proxy for the `.register` method.
     * @return {Object} Returns the generator instance or undefined if not resolved.
     * @api public
     */

    this.define('generator', function(name, fn) {
      if (arguments.length === 1 && typeof name === 'string') {
        var generator = this.getGenerator(name);
        if (generator) return generator;
      }
      this.register(name, fn);
      return this.getGenerator(name);
    });

    /**
     * Invoke the given generator in the context of the current instance.
     *
     * ```js
     * base.invoke('foo');
     * ```
     * @name .invoke
     * @param {String|Object} `app` Generator name or instance.
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    this.define('invoke', function(app) {
      var generator = app;
      if (typeof app === 'string') {
        app = this.generator(app);
      }
      if (typeof app === 'undefined') {
        throw new Error('cannot find generator: ' + generator);
      }

      var fn = app;
      if (utils.isObject(app) && app.isGenerator) {
        fn = app.env.fn;
      }

      if (typeof app === 'function') {
        app = this;
      }
      if (utils.isObject(fn) && app.isGenerator) {
        return this;
      }

      if (typeof fn !== 'function') {
        throw new Error('expected `app.env.fn` to be a function');
      }

      debug('invoking %s', app.env.alias);
      fn.call(this, this, this.base);
      return this;
    });

    /**
     * Extend the current generator instance with the settings of other
     * generators.
     *
     * ```js
     * var foo = base.generator('foo');
     * base.extendWith(foo);
     * // or
     * base.extendWith('foo');
     * // or
     * base.extendWith(['foo', 'bar', 'baz']);
     * ```
     *
     * @name .extendWith
     * @param {String|Object} `app`
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    this.define('extendWith', function(app) {
      if (Array.isArray(app)) {
        return app.forEach(this.extendWith.bind(this));
      }
      this.invoke(app);
      return this;
    });

    // initialize base-generators
    this.lazyGenerators(this);
  };
};
