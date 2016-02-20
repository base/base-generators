'use strict';

var MapCache = require('map-cache');

function define(file, prop, val) {
  var mapCache = new MapCache();

  Object.defineProperty(file, prop, {
    configurable: true,
    enumerable: true,
    set: function(v) {
      mapCache.set(prop, v);
    },
    get: function() {
      var res = mapCache.get(prop);
      if (res) return res;
      if (typeof val === 'function') {
        val = val.call(file);
      }
      mapCache.set(prop, val);
      return val;
    }
  });
}

/**
 * Expose `define`
 */

module.exports = define;
