/*!
 * base-generators <https://github.com/jonschlinkert/base-generators>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var debug = require('debug')('base:generators');
var createApp = require('./lib/app');
var tasks = require('./lib/tasks');
var utils = require('./lib/utils');
var num = 0;

/**
 * Expose `generators`
 */

module.exports = function(config) {
  config = config || {};

  return function plugin(app) {
    if (!utils.isValid(this, 'base-generators')) return;
    debug('initializing <%s>, called from <%s>', __filename, module.parent.id);

    this.isApp = true;
    this.isGenerator = true;
    this.generators = {};
    var cache = {};

    utils.define(this.options, 'validatePlugin', function(app) {
      return app.isGenerator === true || app.isApp === true;
    });

    // register the necessary plugins
    this.use(utils.option());
    this.use(utils.plugins());
    this.use(utils.cwd());
    this.use(utils.pkg());
    this.use(utils.task());

    this.use(utils.env());
    this.use(utils.compose());
    this.use(tasks());
    this.num = num++;

    // make sure constructor is non-enumerable
    this.define('constructor', this.constructor);

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

      this.setGenerator(name, val, options);
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

      var Generator = this.constructor;
      var generator = new Generator();

      createApp.setParent(generator, this);
      createApp.decorate(generator, generator);
      generator.createEnv(name, val, options);

      if (utils.isGenerator(generator.env.app)) {
        var app = generator.env.app;
        createApp.setParent(app, generator);
        createApp.decorate(app, generator);
        generator = app;
      }

      if (generator.env && generator.env.isDefault) {
        this.generators._default = generator;
      }

      // cache the generator
      this.generators[generator.alias] = generator;
      this.generators[generator.name] = generator;

      this.emit('generator', generator.alias, generator);
      return generator;
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

      if (Array.isArray(name)) {
        name = name.join('.');
      }

      if (typeof name !== 'string') {
        throw new TypeError('expected name to be a string');
      }

      if (this.has('cache.runnerContext') && !this.get('cache.hasDefault') && name === 'default') {
        return null;
      }

      var opts = utils.merge({}, this.base.options, this.options, options);
      var generator = this.findGenerator(name, opts);

      if (generator && !generator.isInvoked) {
        generator.isInvoked = true;

        // add instance plugins to generator
        this.run(generator);

        // merge options and data (don't break references)
        utils.merge(generator.cache.data, this.cache.data);
        opts = utils.merge(generator.options, opts);

        // invoke the generator
        generator.invoke(opts);
        this.generators[name] = generator;
      }
      return generator;
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

    this.define('findGenerator', function(name, opts) {
      debug('finding generator "%s"', name);
      if (utils.isObject(name)) {
        return name;
      }

      if (typeof name !== 'string') {
        throw new TypeError('expected name to be a string');
      }

      if (cache[name]) return cache[name];
      var app = this.generators[name] || this.base.generators[name] || this._findGenerator(name, opts);

      // if no app, check the `base` instance
      if (typeof app === 'undefined' && this.hasOwnProperty('parent')) {
        app = this.base._findGenerator(name, opts);
      }

      // if no app, check `node_modules` or the file system
      if (!app && utils.exists(name)) {
        app = this.register(name, opts);
      }

      if (app) {
        cache[name] = app;
        return app;
      }
    });

    /**
     * Private method used by `.findGenerator`
     */

    this.define('_findGenerator', function(name, options) {
      if (~name.indexOf('.')) {
        return this.getSubGenerator.apply(this, arguments);
      }

      var opts = utils.merge({}, this.options, options);
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
      for (var prop in this.generators) {
        var app = this.generators[prop];
        if (app.isMatch(name)) {
          return app;
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

      var app = this.findGenerator(name, options);
      var alias = this.env ? this.env.alias : 'default';
      debug('extending "%s" with "%s"', alias, name);

      if (!utils.isApp(app, 'Generator')) {
        throw new Error('cannot find generator ' + name);
      }

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

      var queue = this.parseTasks(name, tasks);

      utils.eachSeries(queue, function(queued, next) {
        if (cb.name === 'finishRun' && queued.tasks.indexOf(name) !== -1) {
          queued.name = name;
          queued.tasks = ['default'];
        }

        queued.generator = this.getGenerator(queued.name, options);

        if (!utils.isGenerator(queued.generator)) {
          if (queued.name === 'default') {
            next();
          } else {
            var msg = utils.formatError('generator', app, queued.name);
            next(new Error(msg));
          }
          return;
        }
        generate(this, queued, options, next);
      }.bind(this), cb);
      return;
    });

    this.define('generateEach', function() {
      console.log('.generateEach is deprecated. Use `.generate` instead.');
      return this.generate.apply(this, arguments);
    });

    /**
     * Run generators, calling `.config.process` first if it exists.
     *
     * @param {String|Array} `name` generator to run
     * @param {Array|String} `tasks` tasks to run
     * @param {Object} `app` Application instance
     * @param {Object} `generator` generator instance
     * @param {Function} next
     */

    function generate(app, queued, options, next) {
      var generator = queued.generator;
      var tasks = queued.tasks;

      composeGenerator(app, generator);

      if (tasks.length === 1 && !generator.hasTask(tasks[0])) {
        if (tasks[0] === 'default') {
          next();
          return;
        }
        var suffix = queued.name !== 'this' ? ('" in generator: "' + queued.name + '"') : '';
        console.error('Cannot find task: "' + tasks[0] + suffix);
        next();
        return;
      }

      generator.option(options || {});

      var alias = generator.env ? generator.env.alias : generator._name;
      app.emit('generate', alias, queued.tasks, generator);
      if (app._lookup) {
        app.options.lookup = app._lookup;
      }

      // if `base-config` is registered call `.process` first, then run tasks
      if (typeof generator.config !== 'undefined') {
        var config = app.get('cache.config') || {};
        generator.config.process(config, build);
      } else {
        build();
      }

      function build(err) {
        if (err) return done(err);
        generator.build(tasks, done);
      }

      function done(err) {
        if (err) {
          err.queue = queued;
          utils.handleError(app, queued.name, next)(err);
        } else {
          next();
        }
      }
    }

    /**
     * Extend the generator being invoked with settings from the instance,
     * but only if the generator is not the `default` generator.
     *
     * Also, note that this **does not add tasks** from the `default` generator
     * onto the instance.
     */

    function composeGenerator(app, generator, ctx) {
      var env = generator.env || {};
      var alias = env.alias;

      // update `cache.config`
      var config = utils.merge({}, ctx || app.cache.config || app.pkg.get(app._name));
      generator.set('cache.config', config);

      // set options
      generator.option(app.options);
      generator.option(config);

      // extend generator with settings from default
      if (app.generators.hasOwnProperty('default') && alias !== 'default') {
        var compose = generator
          .compose(['default'])
          .options();

        if (typeof app.data === 'function') {
          compose.data();
        }

        if (typeof app.pipeline === 'function') {
          compose.pipeline();
        }

        if (typeof app.helper === 'function') {
          compose.helpers();
          compose.engines();
          compose.views();
        }

        if (typeof app.question === 'function') {
          compose.questions();
        }
      }
    }

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
      if (this && this.options && typeof this.options.toAlias === 'function') {
        return this.options.toAlias(name);
      }
      return name;
    });

    return plugin;
  };
};
