'use strict';

var debug = require('debug')('base:base-generators:generator');
var plugins = require('./plugins');
var utils = require('./utils');

module.exports = function(ctorName, ctor, config) {

  /**
   * Create a new `App` with the given `val`, `options`
   * and `parent` context.
   *
   * ```js
   * var app = new Base();
   * var generator = new App('foo', function() {}, {}, app);
   * ```
   * @param {String} `name`
   * @param {Function|Object|String} `val` App function, filepath or instance.
   * @param {Object} `options`
   * @param {Object} `parent`
   * @api public
   */

  function App(name, val, options, parent) {
    debug('instantiating ' + ctorName + ' "%s"', name);

    this.options = utils.extend({}, config, this.options);
    ctor.call(this);
    this.is(ctorName);

    this.use(plugins.env());
    this.createEnv.apply(this, arguments);

    decorate(this, this);
    setParent(this, parent);

    if (utils.isApp(this.env.app, ctorName)) {
      var app = this.env.app;
      setParent(app, parent);
      decorate(app, this);
      return app;
    }
  }

  /**
   * Inherit `ctor`
   */

  ctor.extend(App);

  /**
   * Make constructor properties non-enumerable
   */

  for (var key in App) {
    utils.define(App, key, App[key]);
  }
  return App;
};

/**
 * Set the parent context for `app`. The `parent` property is used
 * to resolve `app.base`
 *
 * @param {Object} `app`
 * @param {Object} `parent`
 */

function setParent(app, parent) {
  app.options = utils.extend({}, parent.options, app.options);
  app.on('error', parent.emit.bind(parent, 'error'));
  app.define('parent', parent);
  parent.run(app);
}

/**
 * Decorate `app` with `env` properties used for lookups
 * and invoking.
 */

function decorate(app, ctx) {

  /**
   * Get `alias` from `generator.env`
   */

  app.define('alias', {
    configurable: true,
    get: function() {
      return ctx.env.alias;
    }
  });

  /**
   * Get `name` from `generator.env`
   */

  app.define('name', {
    configurable: true,
    get: function() {
      return ctx.env.name;
    }
  });

  /**
   * Invoke `generator.fn` with the given `options` and optional `context`.
   *
   * @param {Object} `options`
   * @param {Object} `context`
   * @return {Object} Returns the context object or generator instance, modified by invoking `fn`.
   * @api public
   */

  app.define('invoke', function(options, context) {
    return ctx.env.invoke(context || ctx, options);
  });

  /**
   * Returns true if `str` matches one of the following properties on `generator.env`
   * - `key`: the original name used to register the generator
   * - `name`: the name of the generator. this can be different than `key` if the generator was registered using a filepath.
   * - `path`: the file path of the generator.
   *
   * @param {String} `str`
   * @return {Boolean}
   * @api public
   */

  app.define('isMatch', function(str) {
    return ctx.env.isMatch(str);
  });
}
