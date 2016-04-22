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
  if (typeof app.option === 'function') {
    app.option(parent.options);
  } else {
    utils.merge(app.options, parent.options);
  }
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
   * Get the generator `alias` created by calling the `app.toAlias` function.
   *
   * ```js
   * console.log(generator.alias);
   * ```
   * @getter
   * @name .alias
   * @return {String} Returns the value from `generator.env.alias`
   * @api public
   */

  app.define('alias', {
    configurable: true,
    set: function(val) {
      alias = val;
    },
    get: function() {
      return alias || (alias = ctx.env && ctx.env.alias);
    }
  });

  /**
   * Get the `name` that was used to originally registered the generator.
   *
   * ```js
   * var app = new Base();
   * var foo = app.register('foo', function() {});
   * console.log(foo.name);
   * //=> 'foo'
   * var bar = foo.register('bar', function() {});
   * console.log(bar.name);
   * //=> 'bar'
   * var baz = bar.register('baz', function() {});
   * console.log(baz.name);
   * //=> 'baz'
   * ```
   * @getter
   * @name .name
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
   * Get a generator's `namespace`, which created from the generator's parent
   * `namespace` plus the generator's `alias`.
   *
   * ```js
   * var foo = app.register('foo', function() {});
   * console.log(foo.namespace);
   * //=> 'foo'
   * var bar = foo.register('bar', function() {});
   * console.log(bar.namespace);
   * //=> 'foo.bar'
   * var baz = bar.register('baz', function() {});
   * console.log(baz.namespace);
   * //=> 'foo.bar.baz'
   * ```
   * @getter
   * @name .namespace
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
   * ```js
   * generator.invoke();
   * ```
   * @name .invoke
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
   * ```js
   * var isMatch = generator.isMatch('foo/bar.js');
   * ```
   * @name .isMatch
   * @param {String} `str`
   * @return {Boolean}
   * @api public
   */

  app.define('isMatch', function(str) {
    return ctx.env.isMatch(str);
  });
};

