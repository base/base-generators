'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils; // eslint-disable-line

/**
 * Utils
 */

require('define-property', 'define');
require('extend-shallow', 'extend');
require('global-modules', 'gm');
require('kind-of', 'typeOf');
require = fn; // eslint-disable-line

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
  try {
    fs.lstatSync(name);
    return true;
  } catch (err) {};

  try {
    var fp = path.resolve('node_modules', name);
    fs.lstatSync(fp);
    return true;
  } catch (err) {}

  try {
    fp = path.resolve(utils.gm, name);
    fs.lstatSync(fp);
    return true;
  } catch (err) {}
  return false;
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
