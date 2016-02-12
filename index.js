/*!
 * base-generators <https://github.com/jonschlinkert/base-generators>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var async = require('async');
var util = require('generator-util');
var debug = require('debug')('base:generators');
var tasks = require('./lib/tasks');
var cache = require('./lib/cache');
var utils = require('./lib/utils');
var env = require('./lib/env');

/**
 * Expose `generators`
 */

module.exports = function generators(config) {
  config = config || {};

  return function(app) {
    if (this.isRegistered('base-generators')) return;

    this.isGenerator = true;
    this.define('firstGen', null);

    var resolveCache = {};
    var globalCache = {};
    var findCache = {};
    var getCache = {};

    /**
     * Add plugins necessary for running generators.
     * Plugins will only be registered once.
     */

    this.define('initGenerators', function() {
      this.options = utils.extend({}, this.options, config);
      if (!this.task) {
        this.use(utils.task(this.options));
      }
      if (!this.fns) {
        this.use(utils.plugin(this.options));
      }
      this.use(utils.cwd(this.options));
      this.use(tasks(this.options));
      this.use(cache(this.options));
      this.use(env(this.options));
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
      var opts = util.extend({ configfile: this.configfile }, options);

      if (resolveCache[name]) {
        return resolveCache[name];
      }

      var fullname = this.toFullname(name);
      debug('resolving: "%s", at cwd: "%s"', name, opts.cwd);
      var filepath = util.tryResolve(fullname, opts)
        || util.tryResolve(name, opts)
        || util.tryResolve(path.join(name, this.configfile), opts)
        || util.tryResolve(path.join(fullname, this.configfile), opts);

      if (filepath) {
        resolveCache[name] = filepath;
        return filepath;
      }
    });

    /**
     * Register configfile with the given `name` and `options`.
     *
     * @param {String} `name`
     * @param {String} `configfile`
     * @param {Object} `options`
     * @return {object}
     * @api public
     */

    this.define('registerConfig', function(name, configfile, options) {
      var opts = util.extend({ cwd: this.cwd }, options);

      debug('registering configfile "%s", at cwd: "%s"', name, opts.cwd);
      this.createEnv('default', configfile, opts);

      var fn = util.configfile(configfile, opts);
      return this.base.invoke(fn);
    });

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
      return this.generators.set(name, fn, this);
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
      var objectPath = util.toGeneratorPath(name);
      if (this.has(objectPath)) {
        return objectPath;
      }
      return false;
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

    this.define('getGenerator', function(name, fn) {
      debug('getting generator "%s"', name);

      if (typeof fn !== 'function') {
        fn = this.toAlias.bind(this);
      }

      if (getCache[name]) {
        return getCache[name];
      }

      var findGlobal = true;
      var props = name.split('.');
      var len = props.length;
      var idx = -1;
      var app = this;

      while (++idx < len) {
        var key = props[idx];
        app = app.findGenerator(key, fn, findGlobal);
        if (!app) {
          break;
        }
        findGlobal = false;
      }

      if (app) {
        getCache[name] = app;
        return app;
      }
    });

    /**
     * Search for globally installed generator `name`. If found, then generator
     * is registered and returned, otherwise `undefined` is returned.
     *
     * @name .globalGenerator
     * @param {String} `name`
     * @return {Object|undefined}
     * @api public
     */

    this.define('globalGenerator', function(name) {
      debug('getting global generator "%s"', name);
      if (globalCache[name]) return globalCache[name];

      var filepath = this.resolve(name);
      if (filepath) {
        this.register(name, filepath);
        var generator = this.generators.get(name);
        if (generator) {
          globalCache[name] = generator;
          return generator;
        }
      }
    });

    /**
     * Find generator `name`, by first searching the cache,
     * then searching the cache of the `base` generator,
     * and last searching for a globally installed generator.
     *
     * @name .findGenerator
     * @param {String} `name`
     * @param {Function} `fn` Optionally supply a rename function.
     * @return {Object|undefined} Returns the generator instance if found, or undefined.
     * @api public
     */

    this.define('findGenerator', function(name, aliasFn, findGlobal) {
      if (typeof aliasFn === 'boolean') {
        findGlobal = aliasFn;
        aliasFn = null;
      }

      debug('finding generator "%s"', name);
      if (findCache[name]) {
        return findCache[name];
      }

      aliasFn = aliasFn || this.toAlias.bind(this);

      // if sub-generator, look for it on the first resolved generator
      if (this.firstGen && this.firstGen.generators[name]) {
        var sub = this.firstGen.getGenerator(name, aliasFn);
        if (sub) {
          return sub;
        }
      }

      // search for generator on the instance cache, then if not found
      // search for the generator on the base instance's cache
      var generator = this.generators.get(name, aliasFn)
        || this.base.generators.get(name, aliasFn);

      // if global lookup is enabled, search global `node_modules`
      if (!generator && findGlobal === true) {
        generator = this.globalGenerator(name);
      }

      // if resolved, cache it
      if (generator) {
        if (!this.firstGen) this.firstGen = generator;
        findCache[name] = generator;
        return generator;
      }
    });

    /**
     * Invoke the given generator in the context of (`this`) the current
     * instance.
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

      var orig = app;
      if (typeof app === 'string') {
        app = this.generator(app);
      }

      if (typeof app === 'undefined') {
        throw new Error('cannot find generator "' + orig + '"');
      }

      debug('invoking generator "%s"', app.namespace);
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
      if (Array.isArray(name)) {
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
        return this.generateEach('default', tasks);
      }

      async.eachSeries(util.arrayify(tasks), function(task, next) {
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

    app.define('toAlias', function toAlias(name, options) {
      var opts = util.extend({}, config, this.options, options);
      if (!opts.prefix && !opts.modulename) {
        opts.prefix = this.prefix;
      }
      var alias = util.toAlias(name, opts);
      debug('created alias "%s" for string "%s"', alias, name);
      return alias;
    });

    /**
     * Create a generator's full name from the given `alias`.
     *
     * @name .fullname
     * @param {String} `alias`
     * @param {Object} `options`
     * @return {String} Returns the full name.
     * @api public
     */

    app.define('toFullname', function toFullname(alias, options) {
      var opts = util.extend({prefix: this.prefix}, config, this.options, options);
      var fullname = util.toFullname(alias, opts);
      debug('created fullname "%s" for alias "%s"', fullname, alias);
      return fullname;
    });

    /**
     * Getter/setter for defining the `configname` name to use for lookups.
     * By default `configname` is set to `generator.js`.
     *
     * @name .configname
     * @api public
     */

    Object.defineProperty(app, 'configname', {
      configurable: true,
      set: function(configname) {
        this.options.configname = configname;
        this.options.configfile = configname + '.js';
      },
      get: function() {
        if (this.options.configname) {
          return this.options.configname;
        }
        return (this.options.configname = utils.basename(this.configfile));
      }
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
     * Getter/setter for defining the `configpath` name to use for lookups.
     * By default `configpath` is set to `generator.js`.
     *
     * @name .configpath
     * @api public
     */

    Object.defineProperty(app, 'configpath', {
      configurable: true,
      set: function(configpath) {
        this.options.configpath = path.resolve(configpath);
      },
      get: function() {
        return this.options.configpath || path.resolve(this.cwd, this.configfile);
      }
    });

    /**
     * Getter/setter for defining the `modulename` name to use for lookups.
     * By default `modulename` is set to `generate`.
     *
     * @name .modulename
     * @api public
     */

    Object.defineProperty(app, 'prefix', {
      configurable: true,
      set: function(prefix) {
        this.options.prefix = prefix;
      },
      get: function() {
        return this.options.prefix || 'generate';
      }
    });

    /**
     * Getter/setter for the `base` (or shared) instance of `generate`.
     *
     * When a generator is registered, the current instance (`this`) is
     * passed as the "parent" instance to the generator. The `base` getter
     * ensures that the `base` instance is always the firstGen instance_.
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

    // initialize base-generators
    this.initGenerators();
  };
};

/**
 * Handle generator errors
 */

function generatorError(err, app, name, cb) {
  var match = /Invalid task `(.*?)`/.exec(err.message);
  if (!match) return cb(err);

  var taskName = match[1];
  if (~name.indexOf(':')) {
    var segs = name.split(':');
    taskName = segs[1];
    name = segs[0];
  }

  var msg = 'Cannot find ';
  if (app.hasGenerator(name) && name !== taskName) {
    msg += 'task: "' + taskName + '" in generator';
  } else if (app.hasGenerator(name) || app.hasConfigfile) {
    msg += 'task';
  } else {
    msg += 'generator';
  }

  msg += ': "' + name + '"';

  var cwd = app.get('options.cwd');
  if (cwd) msg += ' in "' + cwd + '/' + app.configfile + '"';
  return cb(new Error(msg));
}
