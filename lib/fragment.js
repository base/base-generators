'use strict';

var MapCache = require('map-cache');

/**
 * Create a new `FragementCache`
 */

function FragmentCache() {
  this.caches = {};
}

FragmentCache.prototype.cache = function(prop) {
  return this.caches[prop] || (this.caches[prop] = new MapCache());
};

FragmentCache.prototype.get = function(prop, key) {
  return this.cache(prop).get(key);
};

FragmentCache.prototype.set = function(prop, key, val) {
  this.cache(prop).set(key, val);
  return val;
};

/**
 * Expose `FragmentCache`
 */

exports = module.exports = FragmentCache;
