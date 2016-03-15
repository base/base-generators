'use strict';

var utils = require('./utils');

function Search() {
  this.inflections = {};
  this.cache = {};
}

Search.prototype.create = function(name) {
  var single = utils.singular(name);
  var plural = utils.plural(name);

  this.inflections[single] = plural;
  return this;
};

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
