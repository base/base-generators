/*!
 * base-generators <https://github.com/jonschlinkert/base-generators>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var async = require('async');
var util = require('generator-util');
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

    this.define('initGenerators', function() {
      this.set('env.alias', 'base');
      if (typeof this.task !== 'function') {
        this.use(utils.task());
      }
      this.use(register(options));
      this.use(utils.cwd());
      this.use(tasks());
      this.use(cache(options));
      this.use(env());
    });

    /**
     * Register generator `name` with the given `fn`, or get generator `name`
     * if only one argument is passed. This method calls the `.getGenerator` method
     * but goes one step further: if `name` is not already registered, it will try
     * to resolve and register the generator before returning it (or `undefined`
     * if unsuccessful).
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
      debug('generator: "%s"', name);
      this.emit('generator', name);

      if (arguments.length === 1 && typeof name === 'string') {
        var generator = this.getGenerator(name);
        if (generator) return generator;
      }

      this.register(name, fn);
      return this.getGenerator(name);
    });

    /**
     * Return true if the given `name` exists on the `generators`
     * object. Dot-notation may be used to check for sub-generators.
     *
     * ```js
     * base.register('foo', function(app) {
     *   app.register('bar', function() {});
     * });
     *
     * base.hasGenerator('foo');
     * //=> true
     * base.hasGenerator('bar');
     * //=> false
     * base.hasGenerator('foo.bar');
     * //=> true
     * ```
     *
     * @name .hasGenerator
     * @param {String} `name`
     * @return {Boolean} Returns true if the generator exists.
     * @api public
     */

    this.define('hasGenerator', function(name) {
      return this.has(util.toGeneratorPath(name));
    });

    /**
     * Get generator `name` from `app.generators`. Dot-notation
     * may be used to get a sub-generator.
     *
     * ```js
     * var foo = app.getGenerator('foo');
     *
     * // get a sub-generator
     * var baz = app.getGenerator('foo.bar.baz');
     * ```
     * @name .getGenerator
     * @param {String} `name` Generator name.
     * @return {Object|undefined} Returns the generator instance or undefined.
     * @api public
     */

    this.define('getGenerator', function(name) {
      debug('getting generator: "%s"', name);

      var fn = this.alias.bind(this);

      var names = name.split('.');
      var app = this;

      while ((name = names.shift())) {
        app = app.generators.get(name, fn);

        // if generator was not found, try again with `base`
        if (typeof app === 'undefined') {
          app = this.base.generators.get(name);
          if (!app) break;
        }
      }
      return app;
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
      if (Array.isArray(app)) {
        return app.forEach(this.invoke.bind(this));
      }
      if (typeof app === 'string') {
        app = this.generator(app);
      }
      return utils.invoke(app, this);
    });

    /**
     * Alias for `.invoke`, Extend the current generator instance with the settings of other
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
      this.invoke(app);
      return this;
    });

    /**
     * Run a `generator` and `tasks`, calling the given `callback` function
     * upon completion.
     *
     * ```js
     * // run tasks `bar` and `baz` on generator `foo`
     * base.generate('foo', ['bar', 'baz'], function(err) {
     *   if (err) throw err;
     * });
     *
     * // or use shorthand
     * base.generate('foo:bar,baz', function(err) {
     *   if (err) throw err;
     * });
     *
     * // run the `default` task on generator `foo`
     * base.generate('foo', function(err) {
     *   if (err) throw err;
     * });
     *
     * // run the `default` task on the `default` generator, if defined
     * base.generate(function(err) {
     *   if (err) throw err;
     * });
     * ```
     * @name .generate
     * @emits `generate` with the generator `name` and the array of `tasks` that are queued to run.
     * @param {String} `name`
     * @param {String|Array} `tasks`
     * @param {Function} `cb` Callback function that exposes `err` as the only parameter.
     * @api public
     */

    this.define('generate', function(name, tasks, cb) {
      var args = [].slice.call(arguments);
      cb = args.pop();

      var res = this.resolveTasks.apply(this, args);
      debug('generating: "%s"', res.tasks.join(', '));
      this.emit('generate', res.generator.env.alias, res.tasks);

      res.generator.build(res.tasks, function(err) {
        if (err) {
          generatorError(err, this, name, cb);
          return;
        }
        cb();
      }.bind(this));
    });

    /**
     * Iterate over an array of generators and tasks, calling [generate](#generate)
     * on each.
     *
     * ```js
     * // run tasks `a` and `b` on generator `foo`,
     * // and tasks `c` and `d` on generator `bar`
     * base.generateEach(['foo:a,b', 'bar:c,d'], function(err) {
     *   if (err) throw err;
     * });
     * ```
     * @name .generateEach
     * @param {String|Array} `tasks` Array of generators and tasks to run.
     * @param {Function} `cb` Callback function that exposes `err` as the only parameter.
     * @api public
     */

    this.define('generateEach', function(tasks, cb) {
      if (Array.isArray(tasks) && tasks.length === 0) {
        tasks = ['default'];
      }

      if (typeof tasks === 'function') {
        return this.generateEach('default', tasks);
      }

      async.each(util.arrayify(tasks), function(task, next) {
        var args = task.split(':').concat(next);
        app.generate.apply(app, args);
      }, cb);
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
      debug('creating alias for: "%s"', name);
      var opts = util.extend({}, this.options, options);
      return util.toAlias(name, opts);
    });

    // initialize base-generators
    this.initGenerators();
  };
};

/**
 * Handle generator errors
 */

function generatorError(err, app, name, cb) {
  if (!/Invalid/.test(err.message)) {
    return cb(err);
  }

  var msg = 'Cannot find generator or task: "' + name + '"';
  var cwd = app.get('options.argv.cwd');
  if (cwd) msg += ' in "' + cwd + '/' + app.configfile + '"';
  return cb(new Error(msg));
}
