'use strict';

var debug = require('debug')('base:generators:tasks');
var utils = require('./utils');

module.exports = function(options) {
  return function(app) {
    if (this.isRegistered('normalize-tasks')) return;

    if (typeof this.task !== 'function') {
      throw new Error('expected app.task to be a function');
    }

    this.define('getTasks', function(names, tasks) {
      var prop = normalize(names, tasks);
      var segs = prop.split(':');

      debug('normalized task args: %s', prop);
      var res = {generator: this, tasks: []};

      if (segs.length === 1) {
        var tasks = segs[0].split(',');

        // array of tasks, but no generator was specified
        if (tasks.length > 1 && this.hasTask(tasks[0])) {
          res.tasks = tasks;
          return res;
        }

        // try the default generator if not on root
        if (tasks.length > 1) {
          res.generator = this.getGenerator('default');
          res.tasks = tasks;
          return res;
        }

        // one task is specified
        if (this.hasTask(tasks[0])) {
          res.tasks = tasks;
          return res;
        }

        // if the arg is not a task, see if it's a generator
        if (this.hasGenerator(tasks[0])) {
          res.generator = this.getGenerator(tasks[0]);
          res.tasks = ['default'];
          return res;
        }

        if (this.hasGenerator('default')) {
          var generator = this.getGenerator('default');
          if (generator) {
            return generator.getTasks(tasks);
          }
        }

      } else {
        var name = segs[0];
        var tasks = segs[1].split(',');

        res.generator = this.getGenerator(name);
        if (res.generator && res.generator.hasTask(tasks[0])) {
          res.tasks = tasks;
          return res;
        }

        res.generator = this.getGenerator('default.' + name);
        res.tasks = tasks;
        return res;
      }
      return res;
    });

    /**
     * Return true if the given `name` exists on the
     * `app.tasks` object.
     *
     * @param {String} `name`
     */

    app.define('hasTask', function(name) {
      if (!this.tasks.hasOwnProperty(name)) {
        return false;
      }
      var task = this.tasks[name];
      return typeof task.fn === 'function';
    });

    /**
     * Return true if the given `name` exists on the
     * `app.generators` object.
     *
     * @param {String} `name`
     */

    app.define('hasGenerator', function(name) {
      if (~name.indexOf('.')) {
        name = name.split('.').join('.generators.');
      }
      return this.has('generators.' + name);
    });

    /**
     * Normalize the `generator` and `tasks` properties on the given object.
     *
     * @param {Object} `obj`
     * @param {Array} `tasks`
     * @return {Object}
     */

    // app.define('toTasks', function(obj, tasks) {
    //   tasks = utils.arrayify(tasks);
    //   debug('toTasks: %j', tasks);

    //   if (this.hasTask(tasks[0])) {
    //     obj.tasks = tasks;
    //   } else {
    //     obj.generator = getGenerator(this, tasks[0]);
    //     obj.tasks = ['default'];
    //   }
    //   return obj;
    // });
  };
};

function normalize(names, tasks) {
  if (typeof tasks === 'function') {
    tasks = [];
  }
  names = utils.arrayify(names);
  tasks = utils.arrayify(tasks);
  return [names.join('.')]
    .concat(tasks.join(','))
    .filter(Boolean)
    .join(':');
}

/**
 * Expose `normalize`
 */

module.exports.normalize = normalize;
