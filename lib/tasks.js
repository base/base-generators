'use strict';

var util = require('util');
var utils = require('./utils');

/**
 * Expose `parseTasks`
 */

module.exports = function() {
  return function(app) {
    if (!utils.isValid(app) || utils.isRegistered(app, 'base-generators-tasks')) return;

    this.define('parseTasks', function(name, tasks) {
      tasks = utils.toArray(tasks);

      if (Array.isArray(name) && name.length === 1) {
        name = name[0];
      }

      if (typeof name === 'string' && !/:/.test(name) && /,/.test(name)) {
        return [new Config('this', name)];
      }

      if (tasks.length === 0 && typeof name === 'string') {
        var segs = name.split(':');
        if (segs.length > 1) {
          name = segs[0];
          tasks = utils.arrayify(segs[1]);
        } else {
          console.log(name)
        }
      }

      var queue = normalize(this, name, tasks);
      return queue.reduce(function(acc, ele) {
        var res = toQueue(app, ele);
        if (res === null) {
          res = ele;
          res.tasks = res._ || ['default'];
        }
        return acc.concat(res);
      }, []);
    });

    /**
     * Return true if task `name` exists on `app.tasks`.
     *
     * ```js
     * app.task('foo', function() {});
     * console.log(app.hasTask('foo'));
     * //=> true
     * ```
     * @name .hasTask
     * @param {String} `name` Task name to check
     * @api public
     */

    this.define('hasTask', function(name) {
      return this.has(['tasks', name]);
    });
  };
}

function preProcess(name, tasks) {
  return utils.stringify(name, tasks).split(';')
    .reduce(function(acc, str) {
      var segs = str.split(':');
      var obj = {_: [], name: null, tasks: null};
      if (segs.length === 1) {
        obj._ = str.split(',');
      } else {
        obj.name = segs[0];
        obj.tasks = utils.toArray(segs[1]);
      }
      return acc.concat(obj);
    }, []);
}

function normalize(app, name, tasks) {
  if (typeof tasks === 'undefined') {
    return Array.isArray(name)
      ? normalizeArray(app, name)
      : normalizeString(app, name);
  }
  validateTasks(name, tasks, ':');
  return [new Config(name, tasks)];
}

function normalizeArray(app, names) {
  if (isTasks(app, names) && !isGenerators(app, names)) {
    return new Config('this', names);
  }
  return names.reduce(function(acc, ele) {
    return acc.concat(normalizeString(app, ele));
  }, []);
}

function normalizeString(app, name) {
  if (typeof name !== 'string') {
    throw new TypeError('expected name to be a string');
  }
  var segs = name.split(':');
  if (segs.length > 1) {
    return toQueue(app, new Config(segs[0], segs[1]));
  }
  return toQueue(app, new Config(null, null, name));
}

function toQueue(app, queue) {
  if (queue.names && queue.names.length === 1) {
    queue.name = queue.names[0];
    delete queue.names;
  }
  if (queue.name && queue.tasks.length) {
    if (!isGenerator(app, queue.name)) {
      var gen = app.getGenerator(['default', queue.name]);
      if (gen) {
        queue.name = gen.namespace;
        return queue;
      }
      gen = app.getGenerator(['defaults', queue.name]);
      if (gen) {
        queue.name = gen.namespace;
        return queue;
      }
    }

    if (typeof queue._ === 'undefined' || queue._.length === 0) {
      delete queue._;
      return [queue];
    }
  } else if (isTasks(app, queue.name)) {
    queue.tasks = utils.arrayify(queue.name);
    queue.name = 'this';
    return queue;
  }

  return resolveGenerator(app, queue._);
}

function resolveGenerator(app, names) {
  var queued = createConfig(app, names, 'this');
  if (!queued) {
    var gen = app.getGenerator('default');
    queued = createConfig(gen, names, 'default');
  }
  if (!queued) {
    var gen = app.getGenerator('defaults');
    queued = createConfig(gen, names, 'defaults');
  }
  return queued;
}

function createConfig(app, names, namespace) {
  if (app && isGenerators(app, names)) {
    return names.reduce(function(acc, name) {
      return acc.concat(new Config([namespace, name], 'default'));
    }, []);
  }
  if (app && isTasks(app, names)) {
    return new Config(namespace, names);
  }
  return null;
}

function Config(name, tasks, _) {
  if (Array.isArray(name)) {
    if (name[0] === 'this') {
      name = name.slice(1);
    }
    name = name.join('.');
  }
  this.name = name;
  this.tasks = utils.toArray(tasks);
  if (typeof _ !== 'undefined') {
    this._ = utils.toArray(_);
  }
}

function isTask(app, name) {
  return app.tasks.hasOwnProperty(name);
}

function isTasks(app, names) {
  names = utils.toArray(names);
  if (names.length === 0) {
    return false;
  }
  return names.every(function(name) {
    return isTask(app, name);
  });
}

function isGenerator(app, name) {
  return app.generators.hasOwnProperty(name);
}

function isGenerators(app, names) {
  names = utils.toArray(names);
  if (names.length === 0) {
    return false;
  }
  return names.every(function(name) {
    return isGenerator(app, name);
  });
}

function siftInvalid(app, names) {
  names = utils.toArray(names);
  var len = names.length;
  var idx = -1;

  var num = {generators: [], tasks: [], _: []};
  while (++idx < len) {
    var name = names[idx];
    if (isGenerator(app, name)) {
      num.generators.push(name);
    }
    if (isTask(app, name)) {
      num.tasks.push(name);
    }
    if (!isTask(app, name) && !isGenerator(app, name)) {
      num._.push(name);
    }
  }
  return num;
}

function validateTasks(name, tasks, ch) {
  if (Array.isArray(name) && Array.isArray(tasks)) {
    throw new Error('expected a generator name and tasks array');
  }

  tasks = utils.toArray(tasks);
  var len = tasks.length;
  var idx = -1;

  while (++idx < len) {
    if (~tasks[idx].indexOf(ch)) {
      throw new Error('Expected the second argument to be tasks. invalid character `' + ch + '`');
    }
  }
}
