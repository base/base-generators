'use strict';

var generators = require('..');
var runtimes = require('base-runtimes');
var Base = require('base');
Base.use(function fn() {
  this.isApp = true;
  return fn;
});

var argv = require('minimist')(process.argv.slice(2));
var file = argv.file ? require(argv.file) : require('./generators/a');
var tasks = argv._.length ? argv._ : ['default'];

var base = new Base();
base.use(generators());
base.use(runtimes());
base.register('default', file);

base.getGenerator('default')
  .generateEach(tasks, function(err) {
    if (err) throw err;
    console.log('done!');
  });
