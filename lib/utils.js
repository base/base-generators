'use strict';

var fs = require('fs');
var path = require('path');

/**
 * Module dependencies
 */

var debug = require('debug')('generate:utils');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('base-tasks', 'task');
require('base-options', 'option');
require('extend-shallow', 'extend');
require('is-absolute');
require('global-modules', 'gm');
require('kind-of', 'typeOf');
require('try-open');
require = fn;

/**
 * Return the given value as-is
 */

utils.identity = function(val) {
  return val;
};

/**
 * Returns true if a the given `value` is an object.
 *
 * @param {any} `value`
 * @return {Boolean}
 * @api public
 */

utils.isObject = function(value) {
  return utils.typeOf(value) === 'object';
};

/**
 * Cast the given `value` to an array.
 *
 * @param {String|Array} `value`
 * @return {Array}
 * @api public
 */

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Return true if a filepath exists on the file system.
 */

utils.exists = function(fp) {
  return fp ? typeof utils.tryOpen(fp, 'r') === 'number' : false;
};

/**
 * Return true if a directory exists and is empty.
 *
 * @param  {*} val
 * @return {Array}
 */

utils.isEmpty = function(dir, fn) {
  var files;
  try {
    if (!utils.exists(dir)) {
      return false;
    }
    files = fs.readdirSync(dir);
    files = files.filter(fn || function(fp) {
      return !/\.DS_Store/i.test(fp);
    });
    return files.length === 0;
  } catch (err) {};
  return true;
};

/**
 * Return true if a value appears to be an array of tasks.
 * Does not validate the tasks.
 */

utils.isTasks = function(val) {
  return typeof val === 'string' || Array.isArray(val);
};

/**
 * Create a generator name from the given `alias` and
 * `namespace`.
 *
 * ```js
 * utils.toFullname('foo', 'generate');
 * //=> 'generate-foo';
 *
 * utils.toFullname('generate-bar', 'generate');
 * //=> 'generate-bar'
 * ```
 * @param {String} `alias`
 * @param {String} `namespace`
 * @return {String}
 * @api public
 */

utils.toFullname = function(alias, options) {
  var opts = utils.extend({}, options);
  var namespace = opts.modulename;
  if (alias.indexOf(namespace) === 0) {
    return alias;
  }
  return namespace + '-' + alias;
};

/**
 * Attempts to find a generator with the given namespace,
 * starting at the specified `cwd`, then searching globally
 * if not found.
 *
 * @param {String} `alias` A full generator name, alias or filepath may be passed.
 * @param {String} `namespace`
 * @param {String} `cwd`
 * @return {String|Null}
 * @api public
 */

utils.resolve = function(name, options) {
  return utils.resolveLocal(name, options) || utils.resolveGlobal(name, options);
};

/**
 * Resolve the filepath to a locally installed generator with the given
 * namespace, starting the search from the specified `cwd`.
 *
 * @param {String} `alias` A full generator name, alias or filepath may be passed.
 * @param {String} `namespace`
 * @param {String} `cwd`
 * @return {String|Null}
 * @api public
 */

utils.resolveLocal = function(name, options) {
  var opts = utils.extend({}, options);
  if (typeof opts.cwd === 'undefined') {
    opts.cwd = process.cwd();
  }

  if (utils.isAbsolute(name)) {
    return name;
  }

  var fp = path.resolve(opts.cwd, name);
  debug('resolved local path %s', fp);
  if (utils.exists(fp)) {
    return fp;
  }

  name = utils.toFullname(name, opts);
  fp = path.resolve(fp, name);
  debug('resolving local name %s', fp);
  if (utils.exists(fp)) {
    return fp;
  }
};

/**
 * Resolve the filepath to a globally installed generator with the
 * given namespace.
 *
 * @param {String} `alias` A full generator name, alias or filepath may be passed.
 * @param {String} `namespace`
 * @return {String|Null}
 * @api public
 */

utils.resolveGlobal = function(name, options) {
  var opts = utils.extend({}, options);
  if (typeof opts.cwd === 'undefined') {
    opts.cwd = utils.gm;
  }

  name = utils.toFullname(name, opts);
  debug('resolving global name %s', name);

  var fp = path.resolve(opts.cwd, name);
  debug('resolved global path %s', fp);
  if (utils.exists(fp)) {
    return fp;
  }

  fp = utils.tryResolve(name, opts.cwd);
  debug('resolved global path %s', fp);
  if (utils.exists(fp)) {
    return fp;
  }
};

/**
 * Resolve the path to `configfile` from the given
 * `cwd`, and return `null` if not found.
 *
 * @param {String} `configfile` File name to resolve
 * @param {String} `cwd` Working directory to search for `configfile`
 * @return {String|undefined}
 * @api public
 */

utils.configpath = function(name, options) {
  var opts = utils.extend({}, options);
  var full = utils.toFullname(name, opts);

  var configpath = path.resolve(opts.cwd, full, opts.configname);
  if (utils.exists(configpath)) {
    return configpath;
  }
};

/**
 * Display all registered generators and their tasks, and
 * prompt the user to choose the tasks to run.
 */

utils.chooseTasks = function() {
  /**
   * Steps:
   * 1. resolve all global and local generators
   * 2. show generators to choose from
   * 3. build
   */
};

/**
 * Try to `require.resolve` module `name`, first locally
 * then in the globaly npm directory. Fails silently
 * if not found.
 *
 * @param {String} `name` The name or filepath of the module to resolve
 * @return {String|undefined}
 * @api public
 */

utils.tryResolve = function(name, cwd) {
  try {
    return require.resolve(name);
  } catch (err) {}

  try {
    return require.resolve(path.resolve(cwd || process.cwd(), name));
  } catch (err) {}
};

/**
 * Try to require the given module, failing silently if
 * it doesn't exist.
 *
 * @param  {String} `name` The module name or file path
 * @return {any|Null} Returns the value of requiring the specified module, or `null`
 * @api public
 */

utils.tryRequire = function(fp, cwd) {
  try {
    return require(fp);
  } catch (err) {}

  try {
    return require(path.resolve(cwd || process.cwd(), fp));
  } catch (err) {}
};

/**
 * Expose `utils`
 */

module.exports = utils;
