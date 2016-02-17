'use strict';

var path = require('path');
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
require('base-resolver', 'resolver');
require('define-property', 'define');
require('get-value', 'get');
require('is-absolute');
require('extend-shallow', 'extend');
require('array-unique', 'unique');
require = fn;

utils.validate = function(file, opts) {
  if (!/^generate-/.test(file.name)) {
    return false;
  }
  var keys = file.pkg.keywords || [];
  return ~keys.indexOf('generator');
};

/**
 * Invoke the generator `fn` on `app` in the given `context`
 */

utils.invoke = function(app, context) {
  if (!context) {
    context = app;
  }

  var fn = (app.env && app.env.fn) || app;
  if (typeof fn !== 'function') {
    return app;
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

utils.isGenerator = function(filepath, prefix) {
  if (typeof filepath !== 'string') {
    return false;
  }
  var basename = path.basename(path.dirname(filepath));
  return basename.indexOf(prefix) !== -1;
};

/**
 * Return the given value as-is
 */

utils.identity = function(val) {
  return val;
};

/**
 * Get the basename of a filepath, excluding extension.
 */

utils.basename = function(fp) {
  return path.basename(fp, path.extname(fp));
};

/**
 * Expose `utils`
 */

module.exports = utils;
