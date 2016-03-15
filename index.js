/*!
 * base-generators <https://github.com/jonschlinkert/base-generators>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var async = require('async');
var debug = require('debug')('base:base-generators');
var createApp = require('./lib/generator');
var plugins = require('./lib/plugins');
var tasks = require('./lib/tasks');
var utils = require('./lib/utils');

/**
 * Expose `generators`
 */

module.exports = function(Base, config) {
  config = config || {};

  return function plugin() {
    if (this.isRegistered('base-generators')) return;

    if (typeof this.generators === 'undefined') {
      this.generators = {};
    }

    // load plugins
    if (typeof this.task !== 'function') {
      this.use(plugins.task());
    }

    this.isGenerator = true;
    this.use(plugins.plugin());
    this.use(plugins.cwd());
    this.use(plugins.env());
    this.use(tasks());

    // create the `Generator` class
    if (typeof this.Generator === 'undefined') {
      var App = createApp('Generator', Base, config);
      function Generator() {
        return App.apply(this, arguments);
      }
      App.extend(Generator);
      this.define('Generator', App);
      this.define('constructor', this.constructor);
    }

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

    this.define('generator', function(name, val, options) {
      if (arguments.length === 1 && typeof name === 'string') {
        var generator = this.getGenerator(name);
        if (generator || !utils.exists(name)) {
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
     * base.setGenerato('foo', function(app, base) {
     *   // "app" is a private instance created for the generator
     *   // "base" is a shared instance
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

      var generator = new this.Generator(name, val, options, this);
      var alias = generator.alias;
      this.generators[alias] = generator;

      if (alias !== name) {
        this.generators[name] = generator;
      }
      this.emit('generator', alias, generator);
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
      var app = this.findGenerator(name, options);
      if (app) {
        app.invoke(options);
        this.generators[name] = app;
        return app;
      }
    });

    /**
     * Get sub-generator `name`, using dot-notation for nested generators.
     *
     * ```js
     * app.getSubGenerator('foo.bar.baz')'
     * ```'
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

    this.define('findGenerator', function(name, options) {
      debug('finding generator "%s"', name);
      if (typeof name === 'string') {
        return this._findGenerator(name, options) || this.base._findGenerator(name, options);
      }
      return name;
    });

    /**
     *
     */

    this.define('_findGenerator', function(name, options) {
      if (~name.indexOf('.')) {
        return this.getSubGenerator.apply(this, arguments);
      }
      var opts = utils.extend({}, this.options, options);
      if (typeof opts.lookup === 'function') {
        var fn = opts.lookup;
        delete opts.lookup;
        return this.lookupGenerator(name, opts, fn);
      }

      // simple lookup
      var app = this.generators[name];

      // if not found, iterate over generators and check `key`
      // against the generator's `.isMatch` function
      if (typeof app === 'undefined') {
        for (var key in this.generators) {
          if (this.generators.hasOwnProperty(key)) {
            var gen = this.generators[key];
            if (gen.isMatch(name)) {
              return gen;
            }
          }
        }
      }
      // check to see if `app` is module before returning
      if (!app && utils.exists(name)) {
        app = this.register(name, name, options);
      }
      return app;
    });

    /**
     * Tries to find a registered generator that matches `name`
     * by iterating over the `generators` object, and doing a strict
     * comparison of each name returned by the given lookup `fn`.
     * The lookup function receives `name` and must return an array
     * of names to use for the lookup.
     *
     * For example, if the lookup `name`
     * is `foo`, the function might return `["generator-foo", "foo"]`,
     * to ensure that the lookup happens in that order.
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

      var names = fn(name);
      var len = names.length;
      var idx = -1;
      while (++idx < len) {
        var gen = this._findGenerator(names[idx], options);
        if (gen) return gen;
      }
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
     * ```
     *
     * @name .extendWith
     * @param {String|Object} `app`
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    this.define('extendWith', function(name, options) {
      if (Array.isArray(name)) {
        var len = name.length;
        var idx = -1;
        while (++idx < len) {
          this.extendWith(name[idx], options);
        }
        return this;
      }
      debug('extending "%s" with "%s"', this.env.alias, name);
      var app = this.findGenerator(name, options);
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
      if (typeof name === 'function') {
        cb = name;
        name = 'default';
        tasks = ['default'];
      }

      if (Array.isArray(name) && typeof tasks === 'function') {
        return this.generateEach(name, tasks);
      }

      var args = [].slice.call(arguments);
      cb = args.pop();

      if (typeof cb === 'function' && cb.name === 'finishRun') {
        if (typeof name === 'string' && !/\W/.test(name)) {
          var app = this.getGenerator(name);
          tasks = Array.isArray(tasks) ? tasks : ['default'];
          if (tasks[0] === 'default' && !app.hasTask('default')) {
            tasks = ['noop'];
            app.task('noop', function(next) {
              debug('running noop task');
              delete app.tasks.noop;
              next();
            });
          }
          return app.build(tasks, build);
        }
      }

      var res = this.resolveTasks.apply(this, args);
      if (res.tasks === null) {
        debug('no default tasks defined');
        return cb();
      }

      if (res.generator && res.generator.env) {
        debug('generating: "%s"', res.tasks.join(', '));
        this.emit('generate', res.generator.env.alias, res.tasks);
      }

      var config = this.base.cache.config || {};
      var gen = res.generator;
      var self = this;

      if (typeof gen.config === 'undefined') {
        gen.build(res.tasks, build);
        return;
      }

      gen.config.process(config, function(err) {
        if (err) return cb(err);
        gen.build(res.tasks, build);
      });

      function build(err) {
        if (err) {
          generatorError(err, self, name, cb);
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
      if (Array.isArray(tasks) && tasks.length === 0) {
        tasks = ['default'];
      }
      if (typeof tasks === 'function') {
        return this.generate('default', tasks);
      }
      if (typeof tasks === 'string') {
        return this.generate(tasks, cb);
      }
      async.eachSeries(tasks, function(task, next) {
        var args = task.split(':').concat(next);
        this.generate.apply(this, args);
      }.bind(this), cb);
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

    this.define('toAlias', function(name, options) {
      var opts = utils.extend({}, config, this.options, options);
      var alias = name;

      var fn = opts.toAlias || opts.alias;
      if (typeof fn === 'function') {
        alias = fn.call(this, name);
      }

      debug('created alias "%s" for string "%s"', alias, name);
      return alias;
    });

    return plugin;
  };
};

/**
 * Handle generator errors
 */

function generatorError(err, app, name, cb) {
  var match = /task "(.*?)" is not registered/.exec(err.message);
  if (!match) return cb(err);

  var taskName = match[1];
  if (~name.indexOf(':')) {
    var segs = name.split(':');
    taskName = segs[1];
    name = segs[0];
  }

  var msg = 'Cannot find ';
  var gen = app.getGenerator(name);
  if (gen && name !== taskName) {
    msg += 'task: "' + taskName + '" in generator';
  } else if (gen) {
    msg += 'task';
  } else {
    msg += 'generator';
  }

  msg += ': "' + name + '"';

  var cwd = app.get('options.cwd');
  if (cwd) msg += ' in "' + cwd + '"';
  return cb(new Error(msg));
}
