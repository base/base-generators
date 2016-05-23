'use strict';

var utils = require('./utils');

/**
 * Expose `parseTasks`
 */

module.exports = function() {
  return function(app) {
    if (!utils.isValid(app, 'base-generators-tasks')) return;

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
          tasks = utils.toArray(segs[1]);
        } else if (~name.indexOf('.')) {
          tasks = ['default'];
        } else {
          segs = utils.toArray(name);
          if (isTasks(this, segs)) {
            return [new Config('this', segs)];
          } else {
            var res = setTasks(this, segs)
              || setTasks(this, segs, 'default')
              || setTasks(this, segs, 'defaults');
            if (res) return res;

            res = setGenerators(this, segs)
              || setGenerators(this, segs, 'default')
              || setGenerators(this, segs, 'defaults');
            if (res) return res;
          }
        }
      }

      validateTasks(name, tasks, ':');

      return [new Config(name, tasks)].reduce(function(acc, ele) {
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
      if (utils.isGlob(name)) {
        return utils.mm(Object.keys(this.tasks), name).length !== 0;
      }
      return this.has(['tasks', name]);
    });
  };
};

function setTasks(app, names, namespace) {
  if (isTasks(app, names, namespace)) {
    return names.reduce(function(acc, name) {
      return acc.concat(new Config(namespace, name));
    }, []);
  }
}

function setGenerators(app, names, namespace) {
  if (isGenerators(app, names, namespace)) {
    return names.reduce(function(acc, name) {
      return acc.concat(new Config([namespace, name], 'default'));
    }, []);
  }
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
  var gen;

  if (!queued) {
    gen = app.getGenerator('default');
    queued = createConfig(gen, names, 'default');
  }
  if (!queued) {
    gen = app.getGenerator('defaults');
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
    name = name.filter(Boolean);
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

function isTask(app, name, namespace) {
  if (namespace) {
    var gen = app.getGenerator(namespace);
    if (gen) {
      return gen.tasks.hasOwnProperty(name);
    }
    return false;
  }
  return app.tasks.hasOwnProperty(name);
}

function isTasks(app, names, namespace) {
  names = utils.toArray(names);
  if (names.length === 0) {
    return false;
  }
  return names.every(function(name) {
    return isTask(app, name, namespace);
  });
}

function isGenerator(app, name, namespace) {
  if (namespace) {
    var gen = app.getGenerator(namespace);
    if (gen) {
      return gen.generators.hasOwnProperty(name);
    }
  }
  return app.generators.hasOwnProperty(name);
}

function isGenerators(app, names, namespace) {
  names = utils.toArray(names);
  if (names.length === 0) {
    return false;
  }
  return names.every(function(name) {
    return isGenerator(app, name, namespace);
  });
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
