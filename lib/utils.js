'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('base:generators:utils');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils; // eslint-disable-line
var existsCache = {};

/**
 * Utils
 */

require('base-compose', 'compose');
require('base-cwd', 'cwd');
require('base-env', 'env');
require('base-option', 'option');
require('base-pkg', 'pkg');
require('base-plugins', 'plugins');
require('base-task', 'task');

require('define-property', 'define');
require('global-modules', 'gm');
require('kind-of', 'typeOf');
require('mixin-deep', 'merge');
require = fn; // eslint-disable-line

/**
 * Cast `val` to an array
 */

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Returns true if `val` is an object
 */

utils.isObject = function(val) {
  return utils.typeOf(val) === 'object';
};

/**
 * Return true if `filepath` exists on the file system
 */

utils.exists = function(name) {
  if (existsCache.hasOwnProperty(name)) {
    return existsCache[name];
  }

  function set(name, fp) {
    if (name) existsCache[name] = true;
    if (fp) existsCache[fp] = true;
  }

  try {
    fs.lstatSync(name);
    set(name);
    return true;
  } catch (err) {};

  try {
    var fp = path.resolve('node_modules', name);
    if (existsCache[fp]) return true;

    fs.lstatSync(fp);
    set(name, fp);
    return true;
  } catch (err) {}

  try {
    fp = path.resolve(utils.gm, name);
    if (existsCache[fp]) return true;
    fs.lstatSync(fp);
    set(name, fp);
    return true;
  } catch (err) {}

  existsCache[name] = false;
  return false;
};

utils.isGenerator = function(val) {
  return utils.isApp(val, 'Generator');
};

utils.isApp = function(val, ctorName) {
  return utils.isObject(val) && val['is' + ctorName] === true;
};

/**
 * Handle generator errors
 */

utils.generatorError = function generatorError(err, app, name, cb) {
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
  } else {
    // don't error when a `default` generator is not defined
    if (name === 'default') {
      cb();
      return;
    }
    msg += 'generator';
  }

  msg += ': "' + name + '"';

  var cwd = app.get('options.cwd');
  if (cwd) msg += ' in "' + cwd + '"';
  return cb(new Error(msg));
};

/**
 * Expose `utils`
 */

module.exports = utils;
