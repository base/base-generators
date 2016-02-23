'use strict';

var path = require('path');
var debug = require('debug')('base:generators:utils');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils; // eslint-disable-line

/**
 * Utils
 */

require('ansi-bold', 'bold');
require('ansi-yellow', 'yellow');
require('ansi-magenta', 'magenta');
require('arr-union', 'union');
require('array-unique', 'unique');
require('define-property', 'define');
require('extend-shallow', 'extend');
require('get-value', 'get');
require('is-absolute');
require('mixin-deep', 'merge');
require('resolve');
require('vinyl', 'Vinyl');
require = fn; // eslint-disable-line

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

  var isFunction = typeof app === 'function';

  var fn = isFunction ? app : (app.env && app.env.fn);
  if (typeof fn !== 'function') {
    return app;
  }

  var base = context.base;
  var env = context.env;

  debug('invoking "%s"', env && env.alias);
  fn.call(context, context, base, env);
  return context;
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

utils.formatAlias = function(file) {
  return utils.yellow(file.alias);
}

utils.formatPath = function(file) {
  var inspectType = file.inspectType || 'path';
  var fp = file.path;
  if (!/\.\.\//.test(file.relative)) {
    fp = file.relative;
  }
  var name = path.dirname(fp);
  if (name === '.') {
    name = file.name;
  }
  var res = ' <' + utils.magenta(inspectType) + '>';
  if (inspectType === 'function') {
    return res;
  }
  res += ' ';
  res += utils.yellow(utils.bold(name));
  return res;
};

/**
 * Expose `utils`
 */

module.exports = utils;
