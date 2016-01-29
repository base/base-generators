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
require('base-tasks', 'task');
require = fn;

/**
 * Invoke the generator `fn` on `app` in the given `context`
 */

utils.invoke = function(app, context) {
  if (!context) context = app;

  var fn = app.env && app.env.fn;
  if (typeof fn !== 'function') {
    return context;
  }

  debug('invoking "%s"', app.env.alias);
  fn.call(context, context, app.base, app.env);
  return context;
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
