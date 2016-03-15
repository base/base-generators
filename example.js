'use strict';

var register = require('./register');
var Base = require('base');
var base = new Base();

base.use(register());

base.register('foo', function() {});
base.register('bar', function(bar) {
  bar.register('baz', function() {});
});
base.register('verb-generator-foo', 'bar');
base.register('baz', 'bar.baz');

base.register('verb-generator-foo', function() {});
base.register('verb-generator-foo');
base.register('verb-generator-foo', '/abc/xyz/verb-generator-foo');
base.register('/abc/xyz/verb-generator-foo'); // index.js
base.register('/abc/xyz/verb-generator-foo/bar.js');
