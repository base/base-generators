'use strict';

var env = require('base-env');
var assemble = require('assemble-core');
assemble.use(env());

var generator = require('../generator');
var Generator = generator(assemble, {
  aliasFn: function(name, env) {
    return name.replace(/^verb-(.*)-generator?$/, '$1');
  }
});


var gen = new Generator('verb-readme-generator', function() {});
console.log(gen.namespace);
