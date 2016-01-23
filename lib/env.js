'use strict';

var debug = require('debug')('base:generators:env');
var utils = require('./utils');

module.exports = function(options) {
  var paths = {};

  return function(app) {
    if (this.isRegistered('base-env')) return;

    this.define('createEnv', function(name, alias, fn) {
      debug('createEnv · name: %s, alias: %s', name, alias);
      this.env = {};
      this.env.alias = alias;
      this.env.name = name;

      if (typeof fn === 'string') {
        var fp = this.env.path = fn;

        Object.defineProperty(this.env, 'fn', {
          configurable: true,
          enumerable: true,
          get: function() {
            return paths[fp] || (paths[fp] = utils.tryRequire(fp));
          }
        });

      } else if (typeof fn === 'function') {
        this.env.path = undefined;
        this.env.fn = fn;

      } else if (utils.isObject(fn) && fn.isGenerate) {
        this.env.path = undefined;
        this.env.fn = undefined;
      }

      debug('created: %j', this.env);
    });
  };
};
