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

    this.define('resolveTasks', function(names, tasks) {
      var prop = this.stringifyTasks(names, tasks);
      var segs = prop.split(':');

      debug('normalizing task args: "%s"', prop);

      var res = { tasks: (segs[1] || segs[0]).split(',') };
      var len = segs.length;

      // if (~res.tasks[0].indexOf('.')) {
      //   res.tasks = ['default'];
      //   res.generator = this.generators.get(prop);
      //   console.log(res)
      //   return res;
      // }

      var isDefault = res.tasks[0] === 'default';
      function ensureDefault(res) {
        var gen = res.generator;
        if (gen && !gen.hasTask('default')) {
          res.tasks = null;
        }
      }

      if (len > 1) {
        res.generator = this.findGenerator(segs[0]);
        if (isDefault) {
          ensureDefault(res);
        }
        return res;
      }

      if (this.hasTask(res.tasks[0])) {
        res.generator = this;
        return res;
      }

      var generator = this.getGenerator('default');
      if (generator && generator.hasTask(res.tasks[0])) {
        res.generator = generator;
        return res;
      }

      res.generator = this.findGenerator(prop);
      if (res.generator) {
        res.tasks =  ['default'];
        ensureDefault(res);
        return res;
      }

      // let composer handle the error
      res.generator = this;
      return res;
    });

    /**
     * Return true if the given `name` exists on the
     * `app.tasks` object.
     *
     * @param {String} `name`
     * @api public
     */

    this.define('hasTask', function(name) {
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

    this.define('stringifyTasks', function(names, tasks) {
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
