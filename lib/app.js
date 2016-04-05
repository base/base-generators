'use strict';

var utils = require('./utils');

/**
 * Set the parent context for `app`. The `parent` property is used
 * to resolve `app.base`
 *
 * @param {Object} `app`
 * @param {Object} `parent`
 */

exports.setParent = function setParent(app, parent) {
  utils.merge(app.options, parent.options);
  parent.run(app);

  var emit = app.emit;
  app.define('emit', function(name) {
    if (!/starting|finished/.test(name)) {
      parent.emit.apply(parent, arguments);
    }
    emit.apply(app, arguments);
  });

  app.define('parent', parent);
};

/**
 * Decorate `app` with `env` properties used for lookups
 * and invoking.
 */

exports.decorate = function decorate(app, ctx) {
  var name, alias, namespace;

  /**
   * Get the generator `alias`
   *
   * @getter
   * @return {String} Returns the value from `generator.env.alias`
   * @api public
   */

  app.define('alias', {
    configurable: true,
    set: function(val) {
      alias = val;
    },
    get: function() {
      return alias || (alias = ctx.env.alias);
    }
  });

  /**
   * Get the generator `name`
   *
   * @getter
   * @return {String} Returns the value from `generator.env.name`
   * @api public
   */

  app.define('name', {
    configurable: true,
    set: function(val) {
      name = val;
    },
    get: function() {
      return name || (name = ctx.env.name);
    }
  });

  /**
   * Get the generator `namespace`
   *
   * @getter
   * @return {String} Returns the value from `generator.env.namespace`
   * @api public
   */

  app.define('namespace', {
    configurable: true,
    set: function(val) {
      namespace = val;
    },
    get: function() {
      if (namespace) return namespace;
      if (ctx.parent && ctx.parent.namespace) {
        return ctx.parent.namespace + '.' + this.alias;
      }
      return this.alias;
    }
  });

  /**
   * Invoke `generator.fn` with the given `options` and optional `context`.
   *
   * @param {Object} `options`
   * @param {Object} `context`
   * @return {Object} Returns the context object or generator instance, modified by invoking `fn`.
   * @api public
   */

  app.define('invoke', function(options, context) {
    return ctx.env.invoke(context || ctx, options);
  });

  /**
   * Returns true if `str` matches one of the following properties on `generator.env`
   * - `key`: the original name used to register the generator
   * - `name`: the name of the generator. this can be different than `key` if the generator was registered using a filepath.
   * - `path`: the file path of the generator.
   *
   * @param {String} `str`
   * @return {Boolean}
   * @api public
   */

  app.define('isMatch', function(str) {
    return ctx.env.isMatch(str);
  });
};

