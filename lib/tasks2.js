'use strict';

var debug = require('debug')('base:generators:tasks');
var utils = require('generator-util');

module.exports = function(options) {
  return function(app) {
    if (this.isRegistered('base-generators-tasks')) return;

    /**
     * Resolve generators and tasks to run
     *
     * @param {String|Array} `names` If names is an array, it must be task names, otherwise it can be a generator name or a task name.
     * @param {String|Array} `tasks` one or more tasks to run.
     * @return {Object} Returns an object with the `generator` to use and a `tasks` array.
     */

    this.mixin('resolveTasks', function(names, tasks) {
      var prop = this.stringifyTasks(names, tasks);
      var segs = prop.split(':');

      debug('normalizing task args: "%s"', prop);
      var res = {};
      res.generator = this;
      res.tasks = (segs[1] || segs[0]).split(',');

      var len = segs.length;
      var gen = this;

      var isDefault = res.tasks.length === 1 && res.tasks[0] === 'default';
      function ensureDefault(res) {
        if (res.generator && !res.generator.hasTask('default')) {
          res.tasks = null;
        }
      }

      if (!/\W/.test(prop) && gen.hasTask(prop)) {
        debug('simple tasks "%s"', prop);
        res.generator = gen;
        res.tasks = [prop];
        return res;
      }

      var fallback = gen.getGenerator('default');
      if (fallback) {
        gen = fallback;
      }

      if (len > 1) {
        debug('default tasks "%s"', prop);
        res.generator = gen.getGenerator(segs[0]);
        if (isDefault) {
          ensureDefault(res);
        }
        return res;
      }

      if (gen.hasTask(res.tasks[0])) {
        res.generator = gen;
        return res;
      }

      res.generator = gen.getGenerator(prop);
      if (res.generator) {
        res.tasks = ['default'];
        ensureDefault(res);
        return res;
      }

      // let the `composer` lib handle it from here
      res.generator = gen;
      if (prop === 'default') {
        ensureDefault(res);
      }
      return res;
    });

    /**
     * Return true if the given `name` exists on the
     * `app.tasks` object.
     *
     * @param {String} `name`
     * @api public
     */

    this.mixin('hasTask', function(name) {
      return this.has(['tasks', name]);
    });

    /**
     * Create a task string from the given `name` or array of names and
     * `task` or array of tasks.
     *
     * @param {String|Array} `name`
     * @param {String|Array} `tasks`
     * @return {String}
     */

    this.mixin('stringifyTasks', function(names, tasks) {
      debug('stringifying tasks "%j"', arguments);
      if (typeof tasks === 'function') {
        tasks = [];
      }

      names = utils.arrayify(names);
      tasks = utils.arrayify(tasks);

      var res = [names.join('.')]
        .concat(tasks.join(','))
        .filter(Boolean)
        .join(':');

      return res || 'default';
    });
  };
};
