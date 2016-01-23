'use strict';

var utils = require('./utils');

module.exports = function(options) {
  return function(app) {
    if (this.isRegistered('normalize-tasks')) return;

    this.define('normalizeTasks', function(names, tasks) {
      var prop = normalize(names, tasks);
      var segs = prop.split(':');

      var res = {generator: this, tasks: []};
      if (segs.length === 1) {
        return this.toTasks(res, prop.split(','));
      }

      res.generator = app.getGenerator(segs[0]);
      res.tasks = segs[1].split(',');
      return res;
    });

    app.define('isTask', function(name) {
      if (!this.tasks.hasOwnProperty(name)) {
        return false;
      }
      var task = this.tasks[name];
      return typeof task.fn === 'function';
    });

    app.define('toTasks', function(obj, tasks) {
      if (this.isTask(tasks[0])) {
        obj.tasks = tasks;
        return obj;
      }
      obj.generator = this.getGenerator(tasks[0]);
      obj.tasks = ['default'];
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
