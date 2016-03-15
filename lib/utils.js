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
require('npm-paths', 'paths');
require('resolve-glob', 'glob');
require('inflection', 'inflect');
require('kind-of', 'typeOf');
require = fn; // eslint-disable-line

utils.isObject = function(val) {
  return utils.typeOf(val) === 'object';
};

utils.isGenerator = function(val) {
  return utils.isApp(val, 'Generator');
};

utils.isApp = function(obj, ctorName) {
  if (!utils.isObject(obj)) {
    return false;
  }
  if (typeof ctorName === 'undefined') {
    return obj.isBase === true;
  }
  return obj['is' + ctorName] === true;
};

utils.pluralize = function(str) {
  return utils.inflect.pluralize(str.toLowerCase());
};

utils.last = function(arr) {
  return arr[arr.length - 1];
};

/**
 * Return the given value unchanged
 */

utils.identity = function(val) {
  return val;
};

/**
 * Cast val to an array
 */

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
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

/**
 * Create an object-path for looking up a generator.
 *
 * ```js
 * utils.toGeneratorPath('a.b.c');
 * //=> 'generators.a.generators.b.generators.c'
 * ```
 * @param {String} `name`
 * @return {String}
 * @api public
 */

utils.toGeneratorPath = function(name, prefix) {
  if (/[\\\/]/.test(name)) {
    return null;
  }
  if (name.indexOf('generators.') === 0) {
    name = name.slice('generators.'.length);
  }
  if (~name.indexOf('.')) {
    name = name.split(/\.generators\.|\./g).join('.generators.');
  }
  return prefix === false ? name : ('generators.' + name);
};

utils.pascal = function(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

utils.getName = function(val) {
  if (typeof val === 'string') {
    return val;
  }
  if (utils.isObject(val) && val.env) {
    return val.env.alias;
  }
};

utils.isGeneratorPath = function(fp, validateRegex) {
  var re = validateRegex || /^generate-/;
  return re.test(fp);
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
  } else if (gen) {
    msg += 'task';
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
