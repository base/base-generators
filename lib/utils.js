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
require('extend-shallow', 'extend');
require('global-modules', 'gm');
require('is-absolute');
require('kind-of', 'typeOf');
require('resolve');
require('try-open');
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
  return fp && typeof utils.tryOpen(fp, 'r') === 'number';
};

/**
 * Create an "alias" from the given `name` by either stripping
 * `options.prefix` from the name, or just removing everything
 * up to the first dash. If `options.alias` is a function, it
 * will be used instead.
 *
 * @param {String} name
 * @param {Object} options
 * @return {String}
 */

utils.toAlias = function(name, options) {
  var opts = utils.extend({}, options);
  if (typeof opts.alias === 'function') {
    return opts.alias(name);
  }
  if (typeof opts.prefix === 'string') {
    var re = new RegExp('^' + opts.prefix + '-?');
    return name.replace(re, '');
  }
  var basename = path.basename(name, path.extname(name));
  return basename.slice(basename.indexOf('-') + 1);
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
  if (alias.indexOf(opts.modulename) === -1) {
    return opts.modulename + '-' + alias;
  }
  return alias;
};

/**
 * Create an object-path for looking up a generator.
 */

utils.toGeneratorPath = function(name) {
  if (/[\\\/]/.test(name)) {
    return null;
  }
  if (name.indexOf('generators.') === 0) {
    name = name.slice('generators.'.length);
  }
  if (~name.indexOf('.')) {
    name = name.split(/\.generators\.|\./g).join('.generators.');
  }
  return 'generators.' + name;
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

utils.tryResolve = function(name, options) {
  var opts = utils.extend({}, options);
  debug('tryResolve: "%s"', name);

  if (utils.isAbsolute(name) && utils.exists(name)) {
    return name;
  }

  var filepath = opts.cwd ? path.resolve(opts.cwd, name) : name;
  if (opts.configfile && filepath.indexOf(opts.configfile) === -1) {
    filepath = path.join(filepath, opts.configfile);
  }

  // try to resolve `name` from working directory
  try {
    debug('resolving from cwd: "%s"', filepath);
    return utils.resolve.sync(filepath);
  } catch (err) {}

  // if a cwd was defined, go directly to jail, don't pass go.
  if (typeof opts.cwd === 'string') {
    return;
  }

  // try resolve `name` in global npm modules
  try {
    debug('resolving from global modules: "%s"', name);
    return utils.resolve.sync(name, {basedir: utils.gm});
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

utils.tryRequire = function(fp, options) {
  try {
    return require(utils.tryResolve(fp, options));
  } catch (err) {}
};

/**
 * Expose `utils`
 */

module.exports = utils;
