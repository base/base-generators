/*!
 * base-generators <https://github.com/jonschlinkert/base-generators>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var debug = require('debug')('base:generators');
var generator = require('./lib/generator');
var generate = require('./lib/generate');
var plugins = require('./lib/plugins');
var tasks = require('./lib/tasks');
var utils = require('./lib/utils');
var parseTasks = tasks.parse;

/**
 * Expose `generators`
 */

module.exports = function(config) {
  config = config || {};

  return function plugin(app) {
    if (!utils.isValid(app)) return;

    var cache = {};
    this.generators = {};
    this.isGenerator = true;

    this.define('constructor', this.constructor);
    this.use(plugins());
    this.fns.push(plugin);

    /**
     * Alias to `.setGenerator`.
     *
     * ```js
     * base.register('foo', function(app, base) {
     *   // "app" is a private instance created for the generator
     *   // "base" is a shared instance
     * });
     * ```
     * @name .register
     * @param {String} `name` The generator's name
     * @param {Object|Function|String} `options` or generator
     * @param {Object|Function|String} `generator` Generator function, instance or filepath.
     * @return {Object} Returns the generator instance.
     * @api public
     */

    this.define('register', function(name, options, generator) {
      return this.setGenerator.apply(this, arguments);
    });

    /**
     * Get and invoke generator `name`, or register generator `name` with
     * the given `val` and `options`, then invoke and return the generator
     * instance. This method differs from `.register`, which lazily invokes
     * generator functions when `.generate` is called.
     *
     * ```js
     * base.generator('foo', function(app, base, env, options) {
     *   // "app" - private instance created for generator "foo"
     *   // "base" - instance shared by all generators
     *   // "env" - environment object for the generator
     *   // "options" - options passed to the generator
     * });
     * ```
     * @name .generator
     * @param {String} `name`
     * @param {Function|Object} `fn` Generator function, instance or filepath.
     * @return {Object} Returns the generator instance or undefined if not resolved.
     * @api public
     */

    this.define('generator', function(name, val, options) {
      if (arguments.length === 1 && typeof name === 'string') {
        var generator = this.getGenerator(name);
        if (generator) {
          return generator;
        }
      }

      this.setGenerator.apply(this, arguments);
      return this.getGenerator(name);
    });

    /**
     * Store a generator by file path or instance with the given
     * `name` and `options`.
     *
     * ```js
     * base.setGenerator('foo', function(app, base) {
     *   // "app" - private instance created for generator "foo"
     *   // "base" - instance shared by all generators
     *   // "env" - environment object for the generator
     *   // "options" - options passed to the generator
     * });
     * ```
     * @name .setGenerator
     * @param {String} `name` The generator's name
     * @param {Object|Function|String} `options` or generator
     * @param {Object|Function|String} `generator` Generator function, instance or filepath.
     * @return {Object} Returns the generator instance.
     * @api public
     */

    this.define('setGenerator', function(name, val, options) {
      debug('setting generator "%s"', name);

      // ensure local sub-generator paths are resolved
      if (typeof val === 'string' && val.charAt(0) === '.' && this.env) {
        val = path.resolve(this.env.dirname, val);
      }
      return generator(name, val, options, this);
    });

    /**
     * Get generator `name` from `app.generators` and invoke it with the current instance.
     * Dot-notation may be used to get a sub-generator.
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

    this.define('getGenerator', function(name, options) {
      debug('getting generator "%s"', name);
      if (name === 'this') {
        return this;
      }

      var generator = this.findGenerator(name, options);
      if (utils.isValidInstance(generator)) {
        return generator.invoke(generator, options);
      }
    });

    /**
     * Find generator `name`, by first searching the cache, then searching the
     * cache of the `base` generator. Use this to get a generator without invoking it.
     *
     * ```js
     * // search by "alias"
     * var foo = app.findGenerator('foo');
     *
     * // search by "full name"
     * var foo = app.findGenerator('generate-foo');
     * ```
     * @name .findGenerator
     * @param {String} `name`
     * @param {Function} `options` Optionally supply a rename function on `options.toAlias`
     * @return {Object|undefined} Returns the generator instance if found, or undefined.
     * @api public
     */

    this.define('findGenerator', function(name, options) {
      debug('finding generator "%s"', name);
      if (utils.isObject(name)) {
        return name;
      }

      if (Array.isArray(name)) {
        name = name.join('.');
      }

      if (typeof name !== 'string') {
        throw new TypeError('expected name to be a string');
      }

      if (cache[name]) return cache[name];
      var app = this._findGenerator(name, options);

      // if no app, check the `base` instance
      if (typeof app === 'undefined' && this.hasOwnProperty('parent')) {
        app = this.base._findGenerator(name, options);
      }

      if (app) {
        cache[name] = app;
        return app;
      }

      var search = {name, options};
      this.base.emit('unresolved', search, this);
      if (search.app) {
        cache[search.app.name] = search.app;
        return search.app;
      }
    });

    /**
     * Private method used by `.findGenerator`
     */

    this.define('_findGenerator', function(name, options) {
      if (this.generators.hasOwnProperty(name)) {
        return this.generators[name];
      }

      if (~name.indexOf('.')) {
        return this.getSubGenerator.apply(this, arguments);
      }

      var opts = utils.extend({}, this.options, options);
      if (typeof opts.lookup === 'function') {
        var app = this.lookupGenerator(name, opts, opts.lookup);
        if (app) {
          return app;
        }
      }
      return this.matchGenerator(name);
    });

    /**
     * Get sub-generator `name`, optionally using dot-notation for nested generators.
     *
     * ```js
     * app.getSubGenerator('foo.bar.baz');
     * ```
     * @name .getSubGenerator
     * @param {String} `name` The property-path of the generator to get
     * @param {Object} `options`
     * @api public
     */

    this.define('getSubGenerator', function(name, options) {
      debug('getting sub-generator "%s"', name);
      var segs = name.split('.');
      var len = segs.length;
      var idx = -1;
      var app = this;

      while (++idx < len) {
        var key = segs[idx];
        app = app.getGenerator(key, options);
        if (!app) {
          break;
        }
      }
      return app;
    });

    /**
     * Iterate over `app.generators` and call `generator.isMatch(name)`
     * on `name` until a match is found.
     *
     * @param {String} `name`
     * @return {Object|undefined} Returns a generator object if a match is found.
     * @api public
     */

    this.define('matchGenerator', function(name) {
      debug('matching generator "%s"', name);
      for (var key in this.generators) {
        var generator = this.generators[key];
        if (generator.isMatch(name)) {
          return generator;
        }
      }
    });

    /**
     * Tries to find a registered generator that matches `name`
     * by iterating over the `generators` object, and doing a strict
     * comparison of each name returned by the given lookup `fn`.
     * The lookup function receives `name` and must return an array
     * of names to use for the lookup.
     *
     * For example, if the lookup `name` is `foo`, the function might
     * return `["generator-foo", "foo"]`, to ensure that the lookup happens
     * in that order.
     *
     * @param {String} `name` Generator name to search for
     * @param {Object} `options`
     * @param {Function} `fn` Lookup function that must return an array of names.
     * @return {Object}
     * @api public
     */

    this.define('lookupGenerator', function(name, options, fn) {
      if (typeof options === 'function') {
        fn = options;
        options = {};
      }

      if (typeof fn !== 'function') {
        throw new TypeError('expected `fn` to be a lookup function');
      }

      options = options || {};

      // remove `lookup` fn from options to prevent self-recursion
      delete this.options.lookup;
      delete options.lookup;

      var names = fn(name);
      debug('looking up generator "%s" with "%j"', name, names);

      var len = names.length;
      var idx = -1;

      while (++idx < len) {
        var gen = this.findGenerator(names[idx], options);
        if (gen) {
          this.options.lookup = fn;
          return gen;
        }
      }

      this.options.lookup = fn;
    });

    /**
     * Extend the generator instance with settings and features
     * of another generator.
     *
     * ```js
     * var foo = base.generator('foo');
     * base.extendWith(foo);
     * // or
     * base.extendWith('foo');
     * // or
     * base.extendWith(['foo', 'bar', 'baz']);
     *
     * app.extendWith(require('generate-defaults'));
     * ```
     *
     * @name .extendWith
     * @param {String|Object} `app`
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    this.define('extendWith', function(name, options) {
      if (typeof name === 'function') {
        this.use(name, options);
        return this;
      }

      if (Array.isArray(name)) {
        var len = name.length;
        var idx = -1;
        while (++idx < len) {
          this.extendWith(name[idx], options);
        }
        return this;
      }

      var app = this.generators[name] || this.findGenerator(name, options);
      if (!utils.isApp(app, 'Generator')) {
        throw new Error('cannot find generator: "' + name + '"');
      }

      var alias = app.env ? app.env.alias : 'default';
      debug('extending "%s" with "%s"', alias, name);
      app.run(this);
      app.invoke(options, this);
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
     */

    this.define('generate', function(name, tasks, options, cb) {
      if (typeof name === 'function') {
        return this.generate('default', [], {}, name);
      }
      if (utils.isObject(name)) {
        return this.generate('default', ['default'], name, tasks);
      }
      if (typeof tasks === 'function') {
        return this.generate(name, [], {}, tasks);
      }
      if (utils.isObject(tasks)) {
        return this.generate(name, [], tasks, options);
      }
      if (typeof options === 'function') {
        return this.generate(name, tasks, {}, options);
      }

      if (Array.isArray(name)) {
        return utils.eachSeries(name, function(val, next) {
          this.generate(val, tasks, options, next);
        }.bind(this), cb);
      }

      if (typeof cb !== 'function') {
        throw new TypeError('expected a callback function');
      }

      var queue = parseTasks(app, name, tasks);

      utils.eachSeries(queue, function(queued, next) {
        if (queued._ && queued._.length) {
          if (queued._[0] === 'default') return next();
          var msg = utils.formatError('generator', app, queued._);
          next(new Error(msg));
          return;
        }

        if (cb.name === 'finishRun' && typeof name === 'string' && queued.tasks.indexOf(name) !== -1) {
          queued.name = name;
          queued.tasks = ['default'];
        }

        queued.generator = queued.app || this.getGenerator(queued.name, options);

        if (!utils.isGenerator(queued.generator)) {
          if (queued.name === 'default') {
            next();
            return;
          }
          next(new Error(utils.formatError('generator', app, queued.name)));
          return;
        }

        generate(this, queued, options, next);
      }.bind(this), cb);
      return;
    });

    /**
     * Create a generator alias from the given `name`. By default the alias
     * is the string after the last dash. Or the whole string if no dash exists.
     *
     * ```js
     * var camelcase = require('camel-case');
     * var alias = app.toAlias('foo-bar-baz');
     * //=> 'baz'
     *
     * // custom `toAlias` function
     * app.option('toAlias', function(name) {
     *   return camelcase(name);
     * });
     * var alias = app.toAlias('foo-bar-baz');
     * //=> 'fooBarBaz'
     * ```
     * @name .toAlias
     * @param {String} `name`
     * @param {Object} `options`
     * @return {String} Returns the alias.
     * @api public
     */

    this.define('toAlias', function(name, options) {
      if (typeof options === 'function') {
        return options(name);
      }
      if (options && typeof options.toAlias === 'function') {
        return options.toAlias(name);
      }
      if (typeof app.options.toAlias === 'function') {
        return app.options.toAlias(name);
      }
      return name;
    });

    /**
     * Getter that returns `true` if the current instance is the `default` generator
     */

    Object.defineProperty(this, 'isDefault', {
      configurable: true,
      get: function() {
        return this.env && this.env.isDefault;
      }
    });

    return plugin;
  };
};
