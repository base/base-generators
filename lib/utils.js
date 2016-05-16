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
require('is-registered');
require('is-valid-instance', 'isValid');
require('kind-of', 'typeOf');
require('mixin-deep', 'merge');
require = fn; // eslint-disable-line

utils.stringify = function(names, tasks) {
  if (!utils.isString(tasks) && !Array.isArray(tasks)) {
    tasks = [];
  }
  if (!utils.isString(names) && !Array.isArray(names)) {
    names = [];
  }

  names = utils.arrayify(names).filter(Boolean);
  tasks = utils.arrayify(tasks).filter(Boolean);

  if (!names.length && !tasks.length) {
    return 'default';
  }
  if (!tasks.length) {
    return names.join(hasChars(names, /[:,]/) ? ';' : ',');
  }
  return names.join('.') + ':' + tasks.join(',');
};

function hasChars(arr, re) {
  return arr.every(function(ele) {
    return re.test(ele);
  });
}

utils.isValidTasks = function(val) {
  if (!val) return false;
  if (utils.isString(val)) {
    return !/\W/.test(val);
  }
  if (!Array.isArray(val)) {
    return false;
  }
  return val.every(function(str) {
    return utils.isString(str) && !/\W/.test(str);
  });
};

/**
 * Return true if `val` is a string with length greater than zero.
 */

utils.isString = function(val) {
  return val && typeof val === 'string';
};

/**
 * Create an array of tasks
 */

utils.toArray = function(val) {
  if (Array.isArray(val)) {
    return val.reduce(function(acc, str) {
      return acc.concat(utils.toArray(str));
    }, []);
  }
  if (utils.isString(val)) {
    return val.split(',');
  }
  return [];
};

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

utils.handleError = function(app, name, next) {
  return function(err) {
    if (!err) {
      next();
      return;
    }

    var msg = utils.formatError(err, app, name);
    if (!msg) {
      next();
      return
    }

    if (msg instanceof Error) {
      next(err);
      return;
    }

    next(new Error(msg));
  };
};

utils.formatError = function(err, app, name) {
  if (err instanceof Error) {
    var match = /task "(.*?)" is not registered/.exec(err.message);
    if (!match) {
      return err;
    }

    var taskname = match[1];
    if (taskname === 'default') {
      return;
    }

    if (~name.indexOf(':')) {
      var segs = name.split(':');
      taskname = segs[1];
      name = segs[0];
    }
  }

  var msg = 'Cannot find ';
  var gen = app.getGenerator(name);
  if (gen && name !== taskname) {
    msg += 'task: "' + taskname + '" in generator';
  } else {
    // don't error when a `default` generator is not defined
    if (name === 'default') {
      return;
    }
    msg += 'generator';
  }

  msg += ': "' + name + '"';

  var cwd = app.get('options.cwd');
  if (cwd) msg += ' in "' + cwd + '"';
  return msg;
};

/**
 * Expose `utils`
 */

module.exports = utils;
