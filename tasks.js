'use strict';

var utils = require('./lib/utils');

console.log(utils.normalizeTasks('foo', ['a', 'b', 'c']));
console.log(utils.normalizeTasks('foo.sub', ['a', 'b', 'c']));
console.log(utils.normalizeTasks('foo', 'bar'));
console.log(utils.normalizeTasks(['foo', 'bar']));
console.log(utils.normalizeTasks('foo', []));
