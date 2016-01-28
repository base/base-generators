'use strict';

var path = require('path');

/**
 * Module dependencies
 */

var debug = require('debug')('base:generators:utils');
var utils = require('lazy-cache')(require);
/* eslint-disable no-native-reassign */
var fn = require;
/* eslint-disable no-undef */
require = utils;

/**
 * Lazily required module dependencies
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
