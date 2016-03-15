'use strict';

var path = require('path');
var Generators = require('./generators');
var Generator_ = require('./generator');
var plugins = require('./plugins');
var utils = require('./utils');

module.exports = function(Ctor, config) {
  config = config || {};
  var Generator = Generator_(Ctor, config);

  Ctor.on('preInit', function(app) {
    if (app.isAssemble) {
      delete app.options.namespace;
    }
  });

  Ctor.on('init', function(base) {
    if (base.isRegistered('base-init-event')) return;

    base.use(function(app) {
      if (this.isRegistered('base-register')) return;

      app.use(plugins.cwd());
      app.use(plugins.env());

      this.generators = new Generators({Generator: Generator});
      this.mixin('setGenerator', function(name, val, options) {
        return this.generators.set(name, val, options, this);
      });

      this.mixin('getGenerator', function(name, options, invoke) {
        if (name.indexOf('.') < 0) {
          return this.generators.get(name, options, invoke);
        }

        var segs = name.split('.');
        var len = segs.length;
        var idx = -1;
        var gen = this;

        while (++idx < len) {
          var key = segs[idx];
          gen = gen.generators.get(key, options, invoke);
          if (!gen) {
            break;
          }
        }
        return gen;
      });

      this.define('findGenerator', function(name, options) {
        return this.generators.get(name, options, false)
          || this.base.generators.get(name, options, false);
      });

      /**
       * Register a generator function, file path or instance with the given
       * `name` and `options`.
       *
       * @param {String} `name` The generator's name
       * @param {Object|Function|String} `options` or generator
       * @param {Object|Function|String} `generator` Generator function, instance or filepath.
       * @return {Object}
       * @api public
       */

      this.mixin('register', function(name, options, val) {
        if (typeof options === 'string') {
          val = options;
          options = val || {};
        }
        var isOptions = utils.isObject(options) && !options.isGenerator;
        if (!isOptions) {
          val = options;
          options = {};
        }
        if (typeof val === 'undefined') {
          val = name;
        }
        if (typeof val === 'string') {
          var cached = this.findGenerator(val);
          if (cached) val = cached;
        }
        return this.setGenerator(name, val, options);
      });

      this.mixin('extendWith', function(app, options) {
        if (typeof app === 'string') {
          app = this.findGenerator(app, options);
        }
        app.invoke(options, this);
        return this;
      });

      this.mixin('toAlias', function(name) {
        if (typeof config.toAlias === 'function') {
          return config.toAlias(name);
        }
        return name;
      });

    });
  });
};
