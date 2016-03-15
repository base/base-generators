'use strict';

var debug = require('debug')('base:base-generators:generator');
var plugins = require('./plugins');
var utils = require('./utils');

module.exports = function(ctorName, ctor, config) {
  function Generator(name, val, options, parent) {
    debug('instantiating generator "%s"', name);

    var args = [].slice.call(arguments);
    var last = utils.last(args);

    this.options = utils.extend({}, config, this.options);
    ctor.call(this);
    this.is(ctorName);
    this.use(plugins.env());

    if (utils.isApp(last, 'Base')) {
      parent = last;
      this.options = utils.extend({}, parent.options, this.options);
      this.on('error', parent.emit.bind(parent, 'error'));
      this.define('parent', parent);
      parent.run(this);
    }

    this.createEnv.apply(this, arguments);
    if (utils.isGenerator(this.env.app)) {
      decorate(this.env.app, this);
      return this.env.app;
    }

    decorate(this, this);
  }

  /**
   * Inherit `ctor`
   */

  ctor.extend(Generator);

  /**
   * Make constructor properties non-enumerable
   */

  for (var key in Generator) {
    utils.define(Generator, key, Generator[key]);
  }
  return Generator;
};


function decorate(app, ctx) {

  /**
   * Get `alias` from `generator.env`
   */

  Object.defineProperty(app, 'key', {
    configurable: true,
    get: function() {
      return ctx.env.key;
    }
  });

  /**
   * Get `alias` from `generator.env`
   */

  Object.defineProperty(app, 'alias', {
    configurable: true,
    get: function() {
      return ctx.env.alias;
    }
  });

  /**
   * Get `name` from `generator.env`
   */

  Object.defineProperty(app, 'name', {
    configurable: true,
    get: function() {
      return ctx.env.name;
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
}
