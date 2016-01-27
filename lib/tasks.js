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
      var prop = utils.toTasks(names, tasks);
      var segs = prop.split(':');

      debug('normalizing task args: %s', prop);
      var res = {generator: this, tasks: []};
      var cwd = this.option('argv.cwd');

      if (segs.length === 1) {
        if (this.hasGenerator(segs[0])) {
          res.generator = this.getGenerator(segs[0]);
          res.tasks = ['default'];
        } else {
          res.tasks = segs[0].split(',');
        }
        return res;

        // tasks = segs[0].split(',');

        // // array of tasks, but no generator was specified
        // if (tasks.length > 1 && this.hasTask(tasks[0])) {
        //   res.tasks = tasks;
        //   return res;
        // }

        // // try the default generator if not on root
        // if (tasks.length > 1 && !cwd) {
        //   res.generator = this.getGenerator('default');
        //   res.tasks = tasks;
        //   return res;
        // }

        // var name = tasks[0];

        // // one task is specified
        // if (this.hasTask(name)) {
        //   res.tasks = tasks;
        //   return res;
        // }

        // // if the arg is not a task, see if it's a generator
        // generator = this.getGenerator(name);
        // if (!generator) {
        //   var globalGenerator = this.resolve(name);
        //   if (globalGenerator) {
        //     this.register(name, utils.tryRequire(globalGenerator));
        //     generator = this.getGenerator(name);
        //   }
        // }

        // // if the arg is not a task, see if it's a generator
        // if (generator) {
        //   res.generator = generator;
        //   res.tasks = ['default'];
        //   return res;
        // }

        // if (this.hasGenerator('default') && !cwd) {
        //   generator = this.getGenerator('default');
        //   if (generator) {
        //     return generator.getTasks(tasks);
        //   }
        // }

        res.generator = null;
      } else {
        var generator = this.getGenerator(segs[0]);
        tasks = segs[1].split(',');

        res.generator = this.getGenerator(name);
        if (res.generator && res.generator.tasks[tasks[0]]) {
          res.tasks = tasks;
          return res;
        }

        if (cwd) return;
        generator = this.getGenerator('default.' + name);
        if (generator) res.generator = generator;
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
  };
};
