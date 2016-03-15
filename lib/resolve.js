'use strict';

var path = require('path');
var utils = require('./utils');
var cache = {};

module.exports = function(config) {
  return function(app, base) {
    if (this.isRegistered('base-resolver')) return;

    this.define('search', function(name, patterns, options) {
      var opts = utils.extend({ realpath: true }, config, this.options, options);
      opts.patterns = patterns;

      return this.resolve(opts, function(fp) {
        this.emit('search', name, fp);
      }.bind(this));
    });

    this.define('resolve', function(options, fn) {
      var opts = utils.extend({ realpath: true }, config, this.options, options);

      if (typeof opts.patterns === 'undefined') {
        opts.patterns = ['generate-*', '@*/generate-*'];
      }

      var res = [];
      var paths = opts.paths || utils.paths(opts);
      var len = paths.length;
      var idx = -1;

      while (++idx < len) {
        opts.cwd = paths[idx];
        if (!opts.cwd) continue;

        var key = opts.cwd + opts.patterns;
        if (cache[key]) {
          resolve(cache[key], opts);
          continue;
        }

        var files = utils.glob.sync(opts.patterns, opts);
        cache[key] = files;
        resolve(files, opts);
      }

      function resolve(files, opts) {
        for (var i = 0; i < files.length; i++) {
          var fp = path.resolve(opts.cwd, files[i]);
          if (res.indexOf(fp) === -1) {
            if (fn) fn(fp);
            res.push(fp);
          }
        }
      }

      return res;
    });
  };
};
