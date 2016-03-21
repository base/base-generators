'use strict';

var debug = require('debug')('base:base-generators:generator');
var utils = require('./utils');

/**
 * Set the parent context for `app`. The `parent` property is used
 * to resolve `app.base`
 *
 * @param {Object} `app`
 * @param {Object} `parent`
 */

exports.setParent = function setParent(app, parent) {
  app.options = utils.merge({}, parent.options, app.options);

  var emit = app.emit;
  app.define('emit', function() {
    parent.emit.apply(parent, arguments);
    emit.apply(app, arguments);
  });

  app.define('parent', parent);
  parent.run(app);
};

/**
 * Decorate `app` with `env` properties used for lookups
 * and invoking.
 */

exports.decorate = function decorate(app, ctx) {

  /**
   * Get the generator `alias`
   *
   * @getter
   * @return {String} Returns the value from `generator.env.alias`
   * @api public
   */

  app.define('alias', {
    configurable: true,
    get: function() {
      return ctx.env.alias;
    }
  });

  /**
   * Get the generator `name`
   *
   * @getter
   * @return {String} Returns the value from `generator.env.name`
   * @api public
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
