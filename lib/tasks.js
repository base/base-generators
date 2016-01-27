'use strict';

var debug = require('debug')('base:generators:tasks');
var utils = require('./utils');

module.exports = function(options) {
  return function(app) {
    if (this.isRegistered('base-generators-tasks')) return;

    this.define('resolveTasks', function(names, tasks) {
      var prop = this.stringifyTasks(names, tasks);
      var segs = prop.split(':');

      debug('normalizing task args: "%s"', prop);

      var res = { generator: this, tasks: segs[0].split(',') };
      var len = segs.length;

      if (this.hasGenerator(segs[0]) && (!this.hasTask(res.tasks[0]) || len > 1)) {
        res.generator = this.getGenerator(segs[0]);
        res.tasks = segs[1] ? segs[1].split(',') : ['default'];
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
