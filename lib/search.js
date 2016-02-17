'use strict';

module.exports = function() {
  return new Search();
};

function Search() {
  this.cache = {};
}

Search.prototype.set = function(key, val) {
  this.cache[key] = val;
  return this;
};

Search.prototype.get = function(key) {
  return this.cache[key];
};

Search.prototype.has = function(key, val) {
  if (this.cache.hasOwnProperty(key)) {
    return true;
  }
  this.set(key, val);
  return false;
};
