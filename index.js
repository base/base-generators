/*!
 * base-generators <https://github.com/jonschlinkert/base-generators>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var debug = require('debug')('generate');
var register = require('./lib/register');
var tasks = require('./lib/tasks');
var cache = require('./lib/cache');
var utils = require('./lib/utils');
var env = require('./lib/env');

module.exports = function generators(options) {
  return function(app) {
    if (app.isRegistered('base-generators')) return;
    var isRegistered = false;

    /**
     * Add plugins necessary for running generators.
     * Plugins will only be registered once.
     */

    this.define('lazyGenerators', function(app) {
      if (app.hasGenerators) return;
      app.define('hasGenerators', true);
      app.use(utils.option());
      app.use(register(options));
      app.use(utils.task());
      app.use(tasks());
      app.use(cache(options));
      app.use(env());
    });

    /**
     * Invoke generator `name` with the given `fn`.
     *
     * @param {String} `name`
     * @param {Function} `fn` Generator function.
     * @return {Object} Returns the instance of Generate for chaining.
     * @api public
     */

    this.define('generate', function(name, tasks, cb) {
      this.lazyGenerators(this);
      if (typeof tasks === 'function') {
        cb = tasks;
      }
      var res = this.normalizeTasks(name, tasks);
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

    this.define('getGenerator', function(name) {
      this.lazyGenerators(this);
      debug('getting generator: %s', name);
      var names = name.split('.');
      var fn = this.alias.bind(this);
      var app = this;
      while ((name = names.shift())) {
        // try {
          app = app.generators.get(name, fn);
        // } catch (err) {
        //   console.log(err.stack)
        // }
        if (!app) break;
      }
      return app;
    });

    /**
     * Register generator `name` with the given `fn`.
     *
     * @param {String} `name`
     * @param {Function} `fn` Generator function.
     * @return {Object} Returns the instance of Generate for chaining.
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
     * @param {String|Object} `app` Generator name or instance.
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    this.define('invoke', function(app) {
      debug('invoking %s', app.name);
      app = app || this;
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

    this.define('extendWith', function(app) {
      if (typeof app === 'string') {
        app = this.generator(app);
      }
      if (typeof app.env.fn !== 'function') {
        throw new Error('expected `env.fn` to be a function');
      }
      return this.invoke(app);
    });

    // initialize base-generators
    this.lazyGenerators(this);
  };
};
