'use strict';

var runtimes = require('composer-runtimes');
var generators = require('..');
var Base = require('base');
Base.use(generators());
Base.use(runtimes());

var argv = require('minimist')(process.argv.slice(2));
var file = argv.file ? require(argv.file) : require('./generator');

var base = new Base();
base.register('base', file);

base.getGenerator('base')
  .generateEach(argv._, function(err) {
    if (err) throw err;
    console.log('done!');
  });
