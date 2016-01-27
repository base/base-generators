'use strict';

var fs = require('fs');
var path = require('path');

/**
 * Module dependencies
 */

var debug = require('debug')('base:generators:utils');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('base-cwd', 'cwd');
require('base-tasks', 'task');
require('base-options', 'option');
require('extend-shallow', 'extend');
require('is-absolute');
require('global-modules', 'gm');
require('kind-of', 'typeOf');
require('resolve');
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

utils.getGenerator = function(app, name, prefix) {
  if (app.generators.hasOwnProperty(name)) {
    return app.generators[name];
  }

  var alias = app.alias(name);
  if (app.generators.hasOwnProperty(alias)) {
    return app.generators[alias];
  }

  var fullname = utils.toFullname(alias, {modulename: prefix});
  if (app.generators.hasOwnProperty(fullname)) {
    return app.generators[fullname];
  }
};

/**
 * Returns true if a the given `value` is an object.
 *
 * @param {any} `value`
 * @return {Boolean}
 * @api public
 */

utils.getGeneratorPath = function(app, name, prefix) {
  var filepath = path.resolve(name);
  if (utils.exists(filepath)) {
    return filepath;
  }

  var alias = app.alias(name);
  if (utils.exists(alias)) {
    return path.resolve(alias);
  }

  var fullpath = path.resolve(utils.toFullname(alias, {modulename: prefix}));
  if (utils.exists(fullpath)) {
    return fullpath;
  }
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
  return name.slice(name.indexOf('-') + 1);
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

utils.resolvePath = function(modulename, options) {
  return utils.resolveLocal(modulename, options)
    || utils.resolveGlobal(modulename, options);
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

utils.resolveLocal = function(modulename, options) {
  var opts = utils.extend({cwd: process.cwd()}, options);
  var fp = utils.tryResolve(modulename, opts);
  if (utils.exists(fp)) {
    debug('resolved local path %s', fp);
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

utils.resolveGlobal = function(modulename, options) {
  var opts = utils.extend({cwd: utils.gm}, options);
  var fp = utils.tryResolve(modulename, opts);
  if (utils.exists(fp)) {
    debug('resolved global path %s', fp);
    return fp;
  }
};

utils.resolveConfig = function(name, options) {
  var opts = utils.extend({}, options);

  if (typeof opts.configfile !== 'string') {
    throw new Error('expected options.configfile to be a string');
  }

  var configfile = opts.configfile;
  var filepath;

  if (opts.cwd) {
    filepath = path.resolve(opts.cwd, name, configfile);

    // only check global modules if no `cwd` was defined
    if (!utils.exists(filepath)) {
      filepath = path.resolve(opts.cwd, 'node_modules', name, configfile);
    }

  } else {
    filepath = path.resolve(name, configfile);

    // only check global modules if no `cwd` was defined
    if (!utils.exists(filepath)) {
      filepath = path.resolve(utils.gm, name, configfile);
    }
  }

  if (utils.exists(filepath)) {
    debug('resolved config: %s, at %s', configfile, filepath);
    return filepath;
  }
};

/**
 * Create a task string from the given `name` or array of names and
 * `task` or array of tasks.
 *
 * @param {String|Array} `name`
 * @param {String|Array} `tasks`
 * @return {String}
 */

utils.toTasks = function(name, tasks) {
  if (typeof tasks === 'function') {
    tasks = [];
  }
  name = utils.arrayify(name);
  tasks = utils.arrayify(tasks);
  return [name.join('.')]
    .concat(tasks.join(','))
    .filter(Boolean)
    .join(':');
};

/**
 * Display all registered generators and their tasks, and
 * prompt the user to choose the tasks to run.
 */

utils.chooseTasks = function(app, patterns, options) {
  // var generators = utils.glob.sync(patterns, options);
  // var len = generators.length;
  // var idx = -1;
  // var res = [];

  // while (++idx < len) {
  //   var obj = {};
  //   obj.path = generators[idx];
  //   obj.name = path.basename(file);
  //   res.push(obj);
  // }

  /**
   * Steps:
   * 1. resolve all global and local generators
   * 2. show generators to choose from
   * 3. build
   */
};

utils.toPathname = function(name) {
  if (name.charAt(0) !== '.') {
    name = './' + name;
  }
  return name;
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
  // try to resolve module `name` as-is
  try {
    return utils.resolve.sync(name);
  } catch (err) {}

  // try to resolve `./name`
  try {
    return utils.resolve.sync(utils.toPathname(name));
  } catch (err) {}

  // try to resolve module `name` from `opts.cwd`
  try {
    return utils.resolve.sync(name, {
      basedir: opts.cwd
    });
  } catch (err) {}

  // try to resolve module `./name` from `opts.cwd`
  try {
    return utils.resolve.sync(utils.toPathname(name), {
      basedir: opts.cwd
    });
  } catch (err) {}

  // try to resolve module `node_modules/name` from the working directory
  if (opts.configfile) {
    var cwd = path.resolve(opts.cwd || process.cwd(), 'node_modules');
    var fp = path.join(utils.toPathname(name), opts.configfile);
    try {
      return utils.resolve.sync(fp, {basedir: cwd});
    } catch (err) {}
  }

  // try to resolve module `name` from global npm modules
  try {
    return utils.resolve.sync(name, {
      basedir: utils.gm
    });
  } catch (err) {}

  // try to resolve module `./name` from global npm modules
  try {
    return utils.resolve.sync(utils.toPathname(name), {
      basedir: utils.gm
    });
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
