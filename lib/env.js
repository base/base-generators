'use strict';

var path = require('path');

module.exports = function(options) {
  return function(app) {
    if (this.isRegistered('base-env')) return;

    /**
     * Get the current working directory.
     */

    Object.defineProperty(app, 'cwd', {
      configurable: true,
      set: function(cwd) {
        this.cache.cwd = path.resolve(cwd);
      },
      get: function() {
        return path.resolve(this.cache.cwd || this.options.cwd || process.cwd());
      }
    });

    /**
     * Get the package.json from the current working directory.
     */

    Object.defineProperty(app, 'pkg', {
      configurable: true,
      set: function(pkg) {
        this.cache.pkg = pkg;
      },
      get: function() {
        if (this.cache.pkg) {
          return this.cache.pkg;
        }
        var pkgPath = path.resolve(this.cwd, 'package.json');
        return (this.cache.pkg = require(pkgPath));
      }
    });
  };
};
