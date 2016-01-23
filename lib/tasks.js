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
        return this.toTasks(res, prop.split(','));
      }

      res.generator = app.getGenerator(segs[0]);
      res.tasks = segs[1].split(',');
      return res;
    });

    /**
     * Return true if the given `name` exists on the
     * `app.tasks` object.
     *
     * @param {String} `name`
     */

    app.define('isTask', function(name) {
      if (!this.tasks.hasOwnProperty(name)) {
        return false;
      }
      var task = this.tasks[name];
      return typeof task.fn === 'function';
    });

    /**
     * Normalize the `generator` and `tasks` properties on the given object.
     *
     * @param {Object} `obj`
     * @param {Array} `tasks`
     * @return {Object}
     */

    app.define('toTasks', function(obj, tasks) {
      debug('toTasks: %j', tasks);

      if (this.isTask(tasks[0])) {
        obj.tasks = tasks;
      } else {
        obj.generator = this.getGenerator(tasks[0]);
        obj.tasks = ['default'];
      }
      return obj;
    });
  };
};

function normalize(names, tasks) {
  if (typeof tasks === 'function') {
    tasks = [];
  }
  tasks = utils.arrayify(tasks);
  names = utils.arrayify(names);
  return [names.join('.')]
    .concat(tasks.join(','))
    .filter(Boolean)
    .join(':');
}

// console.log(normalize('foo'))
// console.log(normalize('foo', function() {}))
// console.log(normalize('foo', []))
// console.log(normalize('foo:a,b,c'))
// console.log(normalize('foo.bar:a,b,c'))
// console.log(normalize('foo.bar', 'a,b,c'))
// console.log(normalize('foo', 'a,b,c'))
// console.log(normalize('foo', ['a', 'b', 'c']))
// console.log(normalize(['foo', 'bar'], ['a', 'b']))
// console.log(normalize(['foo', 'bar'], 'a,b,c'))
