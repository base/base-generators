'use strict';

/**
 * Module dependencies
 */

var debug = require('debug')('base:generators:utils');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Utils
 */

require('base-cwd', 'cwd');
require('base-task', 'task');
require('base-plugins', 'plugin');
require('get-value', 'get');
require('extend-shallow', 'extend');
require('array-unique', 'unique');
require = fn;

/**
 * Invoke the generator `fn` on `app` in the given `context`
 */

utils.invoke = function(app, context) {
  if (!context) {
    context = app;
  }

  var fn = typeof app !== 'function'
    ? app.env && app.env.fn
    : app;

  if (typeof fn !== 'function') {
    return context;
  }

  var base = context.base;
  var env = context.env;

  debug('invoking "%s"', env.alias);
  fn.call(context, context, base, env);
  return app;
};

/**
 * Return the given value as-is
 */

utils.identity = function(val) {
  return val;
};

/**
 * Expose `utils`
 */

module.exports = utils;
