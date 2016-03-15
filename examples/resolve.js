'use strict';

// require('time-require');
var task = require('base-task');
var assemble = require('assemble-core');
var resolve = require('../lib/resolve');
var register = require('..');
var env = require('base-env');

var app = assemble();
app.use(env());
app.use(resolve());
app.use(register());

app.on('resolve', function(file) {
  console.log(file);
});

app.on('search', function(type, fp) {
  console.log(type, fp);
});

// var files = app.resolve();

app.search('generator', 'verb-*-generator', {
  alias: function(name) {
    return name.replace(/^verb-([^-]+)-generator/g, '$1');
  }
});

app.search('verb', 'verb-*-generator', {
  alias: function(name) {
    return name.replace(/^verb-([^-]+)-generator/g, '$1');
  }
});

// console.log(files);
