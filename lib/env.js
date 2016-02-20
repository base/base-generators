'use strict';

var path = require('path');
var util = require('generator-util');
var debug = require('debug')('base:generators:env');
var define = require('./define');
var utils = require('./utils');

module.exports = function(config) {
  var paths = {};

  return function(app) {
    if (this.isRegistered('base-generators-env')) return;

    /**
     * Create an `env` object for a generator with the given `fn`.
     *
     * - If `fn` is a filepath, the path will be resolved and validated, but not required, allowing it to be lazily invoked later.
     * - If `fn` is a function, it will be lazily invoked when the generator is called.
     *
     * @param {String} `name` The name, alias or path of the generator.
     * @param {Object|Function|String} `options` Options, path or generator function.
     * @param {Object|String} `fn` Generator function or path.
     * @return {Object}
     */

    this.mixin('createEnv', function(name, options, fn) {
      if (!util.isObject(options)) {
        fn = options;
        options = {};
      }

      var opts = util.extend({verbose: true}, config, this.options, options);
      // var env = new Env(this, name, opts, fn);
      this.env = this.env || {};
      var env = this.env;

      if (!opts.prefix && !opts.modulename) {
        opts.prefix = this.prefix || 'generate';
      }

      env.options = opts;
      env.configfile = this.configfile;

      var inspect = '<Generator ' + name;

      if (typeof fn === 'string') {
        envPath(this, name, env, opts, fn);
        inspect += ' [string] ' + env.path;

      } else if (typeof fn === 'function') {
        envFn(this, name, env, opts, fn);
        inspect += ' [function] ' + env.path;

      } else if (util.isObject(fn) && fn.isGenerator) {
        envFn(this, name, env, opts, fn);
        inspect += ' [instance] ' + env.path;
      }

      if (env.path && util.isDirectory(env.path)) {
        env.path = path.resolve(env.path, env.configfile);
      }

      inspect += '>';
      env.inspect = function() {
        return inspect;
      };

      debug('created: %j', env);
      return env;
    });
  };

  function envPath(app, name, env, opts, filepath) {
    env.path = env.path || filepath;

    if (!util.isAbsolute(env.path)) {
      env.path = util.tryResolve(filepath, { configfile: app.configfile });
    }

    if (typeof env.path === 'undefined' || !util.exists(env.path)) {
      throw new Error('cannot find generator: ' + filepath);
    }

    env.alias = app.toAlias(name, opts);
    env.name = app.toFullname(env.alias, opts);
    createPaths(app, name, env, opts);

    define(env, 'cwd', function() {
      return path.dirname(env.path);
    });

    define(env, 'templates', function() {
      return path.resolve(env.cwd, 'templates');
    });

    define(env, 'fn', function() {
      if (paths[env.path]) return paths[env.path];

      if (util.isObject(fn)) {
        paths[env.path] = fn;
        return fn;
      }

      var fn = util.tryRequire(env.path) || util.tryRequire(env.cwd);
      if (fn) {
        paths[env.path] = fn;
        return fn;
      }
    });
  }

  function envFn(app, name, env, opts, fn) {
    env.alias = name;
    env.name = name;
    env.path = undefined;
    env.fn = fn;
    createPaths(app, name, env, opts);
  }

  function createPaths(app, name, env, opts) {
    if (typeof opts.alias === 'function') {
      env.alias = opts.alias(name, opts);
    }
    app.name = env.alias;
    debug('createEnv · name: "%s", alias: "%s"', env.name, env.alias);
  }
};

// function define(obj, prop, fn) {
//   Object.defineProperty(obj, prop, {
//     configurable: true,
//     enumerable: true,
//     set: function(val) {
//       define(obj, prop, val);
//     },
//     get: function() {
//       return fn();
//     }
//   });
// }

function Env(app, fp, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  var opts = utils.extend({}, app.options, options);
  var file = new utils.Vinyl({path: fp});
  var cwd = path.dirname(file.path);

  // var fragment = app.generators.fragment;

  // file.pkgPath = path.resolve(cwd, 'package.json');
  // var pkg;

  // define(file, 'pkg', function() {
  //   return (pkg = require(file.pkgPath) || {});
  // });

  // define(file, 'name', function() {
  //   // if the dirname is the current working directory, this is our default generator
  //   var name = file.dirname !== process.cwd()
  //     ? (pkg ? pkg.name : path.basename(file.dirname))
  //     : name = 'default';

  //   fragment.set('name', name, file);
  //   return name;
  // });

  // define(file, 'fn', function() {
  //   if (typeof fn === 'function') {
  //     return fn;
  //   }
  //   fn = fragment.get('fn', file.name);
  //   if (typeof fn === 'function') {
  //     return fn;
  //   }

  //   fn = require(file.path);
  //   fragment.set('fn', fn);
  //   return fn;
  // });

  // define(file, 'alias', function() {
  //   var alias = typeof opts.alias === 'function'
  //     ? opts.alias.call(file, file.name)
  //     : utils.aliasFn.call(file, file.name, file);

  //   if (alias) {
  //     fragment.set('alias', alias, file);
  //   }
  //   return alias;
  // });

  var inspect = '<Generator ' + utils.formatAlias(file) + utils.formatPath(file) + '>';
  if (opts.verbose) {
    inspect = {};
    for (var key in file) {
      inspect[key] = file[key];
    }
  }

  file.inspect = function() {
    return inspect;
  };

  return file;
};

