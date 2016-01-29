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

      var res = { generator: this, tasks: segs[0].split(',') };
      var len = segs.length;

      if (this.hasGenerator(segs[0]) && (!this.hasTask(res.tasks[0]) || len > 1)) {
        res.generator = this.getGenerator(segs[0]);
        res.tasks = segs[1] ? segs[1].split(',') : ['default'];

      } else if (this.hasGenerator('default')) {
        var gen = this.getGenerator('default');
        return gen.resolveTasks(names, tasks);
      }

      return res;
    });

    /**
     * Return true if the given `name` exists on the
     * `app.tasks` object.
     *
     * @param {String} `name`
     */

    this.define('hasTask', function(name) {
      if (!this.tasks.hasOwnProperty(name)) {
        return false;
      }
      var task = this.tasks[name];
      return typeof task.fn === 'function';
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
