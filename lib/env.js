'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('base:generators:env');
var utils = require('./utils');

module.exports = function(config) {
  var paths = {};

  return function(app) {
    if (this.isRegistered('base-env')) return;

    this.define('createEnv', function(name, options, fn) {
      if (!utils.isObject(options)) {
        fn = options;
        options = {};
      }

      var opts = utils.extend({}, config, this.options, options);
      if (!this.env) this.env = {};

      this.env.alias = utils.toAlias(name, opts);
      this.env.name = utils.toFullname(this.env.alias, {
        modulename: this.modulename
      });

      debug('createEnv · name: %s, alias: %s', name, this.env.alias);

      if (typeof fn === 'string') {
        this.env.path = this.resolve(fn);

        if (typeof this.env.path === 'undefined') {
          throw new Error('cannot find generator: ' + fn);
        }

        Object.defineProperty(this.env, 'fn', {
          configurable: true,
          enumerable: true,
          get: function() {
            return paths[this.path] || (paths[this.path] = utils.tryRequire(this.path));
          }
        });

      } else if (typeof fn === 'function') {
        this.env.path = undefined;
        this.env.fn = fn;
      }

      debug('created: %j', this.env);
      return this.env;
    });
  };
};
