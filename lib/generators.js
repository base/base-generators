'use strict';

/**
 * Create an instance of `Generators` with the given `options`
 *
 * @param {Object} options
 * @api public
 */

function Generators(cache, options) {
  this.options = options || {};
  this.cache = cache || {};
}

Generators.prototype.set = function(name, val, options, parent) {
  var env = this.createEnv(name, val, options, parent);
  parent.run(env);
  this.cache[env.alias] = env;
  return env;
};

Generators.prototype.get = function(name, options, invoke) {
  var env = this.cache[name];
  if (env) {
    return invoke !== false ? env.invoke(options) : env;
  }

  for (var key in this.cache) {
    if (this.cache.hasOwnProperty(key)) {
      env = this.cache[key];

      if (env.isMatch(name)) {
        if (invoke !== false) {
          env.invoke(options);
        }
        this.cache[name] = env;
        return env;
      }
    }
  }
};

/**
 * Expose `Generators`
 */

module.exports = Generators;
