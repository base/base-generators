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

module.exports = function generators(options) {
  return function(app) {
    if (this.isRegistered('base-generators')) return;

    /**
     * Add plugins necessary for running generators.
     * Plugins will only be registered once.
     */

    this.mixin('lazyGenerators', function(app) {
      if (!app.hasGenerators) {
        app.define('hasGenerators', true);
        app.use(register(options));
        app.use(utils.option());
        app.use(utils.task());
        app.use(utils.cwd());
        app.use(tasks());
        app.use(cache(options));
        app.use(env());
      }
    });

    /**
     * Invoke generator `name` with the given `fn`.
     *
     * @param {String} `name`
     * @param {Function} `fn` Generator function.
     * @return {Object} Returns the instance of Generate for chaining.
     * @api public
     */

    this.mixin('generate', function(name, tasks, cb) {
      if (typeof tasks === 'function') {
        cb = tasks;
      }
      var res = this.getTasks(name, tasks);
      if (typeof res.generator === 'undefined') {
        throw new Error('cannot find generator or task: ' + name);
      }
      debug('running tasks %s', res.tasks.join(', '));
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
     * @param {String} `name` Generator name.
     * @return {Object|undefined} Returns the generator or undefined.
     * @api public
     */

    this.mixin('getGenerator', function(name) {
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
     * @param {String} `name`
     * @param {Function|Object} `fn` Generator function or instance if registering.
     * @return {Object} Returns the generator instance.
     * @api public
     */

    this.mixin('generator', function(name, fn) {
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
     * @param {String|Object} `app` Generator name or instance.
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    this.mixin('invoke', function(app) {
      var generator = app;
      if (typeof app === 'string') {
        app = this.generator(app);
      }
      if (typeof app === 'undefined') {
        throw new Error('cannot find generator: ' + generator);
      }
      if (typeof app.env.fn !== 'function') {
        throw new Error('expected `env.fn` to be a function');
      }
      app = app || this;
      debug('invoking %s', app.env.alias);
      app.env.fn.call(this, this, this.base);
      return this;
    });

    /**
     * Extend the current generator instance with all of the
     * configuration settings from the given generator.
     *
     * @param {String|Object} `app`
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    this.mixin('extendWith', function(app) {
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
