/*!
 * base-generators <https://github.com/jonschlinkert/base-generators>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var async = require('async');
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
    if (!isValidInstance(this)) return;
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

    // ensure this plugin is registered on generators
    this.fns.push(plugin);
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
      generator.createEnv(name, val, options, this);

      if (utils.isGenerator(generator.env.app)) {
        var app = generator.env.app;
        createApp.setParent(app, generator);
        createApp.decorate(app, generator);
        generator = app;
      }

      // cache the generator
      this.generators[generator.alias] = generator;
      this.generators[generator.name] = generator;

      this.emit('generator', generator.alias, generator);
      return generator;
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

    this.define('getGenerator', function(name, options) {
      debug('getting generator "%s"', name);
      var opts = utils.merge({}, this.options, options);
      var app = this.findGenerator(name, opts);
      if (app) {
        if (!app.isInvoked) {
          app.isInvoked = true;
          this.run(app);
          app.options = utils.merge({}, app.options, opts);
          app.invoke(opts);
          this.generators[name] = app;
        }
        return app;
      }
    });

    /**
     * Find generator `name`, by first searching the cache,
     * then searching the cache of the `base` generator.
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
      if (typeof name !== 'string') {
        return name;
      }

      if (cache[name]) return cache[name];
      var app = this.generators[name] || this._findGenerator(name, opts);

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
     * Get sub-generator `name`, using dot-notation for nested generators.
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
     * @api public
     */

    this.define('generate', function(name, tasks, cb) {
      if (Array.isArray(name) && typeof tasks === 'function') {
        return this.generateEach(name, tasks);
      }

      var args = [].slice.call(arguments);
      cb = args.pop();

      if (typeof cb !== 'function') {
        throw new TypeError('expected a callback function');
      }

      var resolved = this.resolveTasks.apply(this, args);

      if (cb.name === 'finishRun' && resolved.tasks.indexOf(name) !== -1) {
        var generator = this.getGenerator(name);
        if (generator) {
          extendGenerator(this, generator);
          return generator.build('default', cb);
        }
      }

      return this.runTasks(name, resolved, cb);
    });

    function extendGenerator(app, generator) {
      var alias = generator.env && generator.env.alias;

      // extend generator with settings from default
      if (app.generators.hasOwnProperty('default') && alias !== 'default') {
        var compose = generator.compose('default')
          .options()
          .tasks();

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
      }
    }

    /**
     * Run generators and tasks
     */

    this.define('runTasks', function(name, resolved, cb) {
      var generator = resolved.generator;
      var tasks = resolved.tasks;

      if (!tasks) {
        this.emit('error', new Error('no default task defined'));
        return cb();
      }
      if (!generator) {
        this.emit('error', new Error(name + ' generator is not registered'));
        return cb();
      }

      debug('generating: "%s"', tasks.join(', '));
      this.emit('generate', generator.alias, tasks, generator);

      var config = this.get('cache.config') || {};
      var self = this;

      // extend `generator` with settings from `app`
      extendGenerator(this, generator);

      // if `base-config` is registered call `.process` first, then run tasks
      if (typeof generator.config !== 'undefined') {
        generator.config.process(config, function(err, res) {
          if (err) return cb(err);
          self.set('cache.config', res || config);
          generator.option(res || config);
          generator.build(tasks, build);
        });
        return;
      }

      // run tasks
      generator.build(tasks, build);
      function build(err) {
        if (err) {
          utils.generatorError(err, self, name, cb);
        } else {
          cb();
        }
      }
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
      if (typeof tasks === 'function') {
        cb = tasks;
        tasks = ['default'];
      }

      if (typeof tasks === 'string') {
        tasks = [tasks];
      }

      var len = tasks.length;
      var idx = -1;
      var arr = [];
      var app = this;

      while (++idx < len) {
        var val = tasks[idx];
        arr.push({name: val, resolved: app.resolveTasks(val)});
        if (this._lookup) {
          this.options.lookup = this._lookup;
        }
      }

      async.eachSeries(arr, function(obj, next) {
        app.runTasks(obj.name, obj.resolved, next);
      }, cb);
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
      if (this && this.options && typeof this.options.toAlias === 'function') {
        return this.options.toAlias(name);
      }
      return name;
    });

    return plugin;
  };
};

function isValidInstance(app) {
  if (!app.isApp && !app.isGenerator) {
    return false;
  }
  if (app.isRegistered('base-generators')) {
    return false;
  }
  return true;
}
