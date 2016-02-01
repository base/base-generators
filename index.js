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

module.exports = function generators(config) {
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
      this.use(register(config));
      this.use(utils.cwd());
      this.use(tasks());
      this.use(cache(config));
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
      debug('registering generator: "%s"', name);
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

    this.define('getGenerator', function(name, fn) {
      debug('getting generator: "%s"', name);

      if (typeof fn !== 'function') {
        fn = this.toAlias.bind(this);
      }

      // var app = this.generators.get(name, fn);
      // if (app) {
      // console.log(app)
      //   return app;
      // }

      var props = name.split('.');
      var app = this;
      var prop;

      while ((prop = props.shift())) {
        var generator = this.findGenerator(prop, fn);
        if (!generator) {
          break;
        }
        app = generator;
        continue;
      }

      return app;
    });

    this.define('globalGenerator', function(name) {
      debug('getting global generator: "%s"', name);
      var filepath = this.resolve(name);
      if (filepath) {
        return this.generator(name);
      }
    });

    this.define('findGenerator', function(name, fn) {
      return this.generators.get(name, fn)
        || this.base.generators.get(name, fn)
        || this.globalGenerator(name);
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
      if (Array.isArray(name)) {
        return this.generateEach(name, tasks);
      }

      var args = [].slice.call(arguments);
      cb = args.pop();

      var res = this.resolveTasks.apply(this, args);
      if (res.tasks === null) {
        debug('no default tasks defined');
        this.emit('task:skipping');
        return cb();
      }

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
      debug('creating alias for: "%s"', name);
      var opts = util.extend({}, config, this.options, options);
      return util.toAlias(name, opts);
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
      debug('creating fullname for: "%s"', alias);
      var opts = util.extend({prefix: this.modulename}, config, this.options, options);
      return util.toFullname(alias, opts);
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
  } else if (app.hasGenerator(name)) {
    msg += 'task';
  } else {
    msg += 'generator';
  }

  msg += ': "' + name + '"';

  var cwd = app.get('options.cwd');
  if (cwd) msg += ' in "' + cwd + '/' + app.configfile + '"';
  return cb(new Error(msg));
}
