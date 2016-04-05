'use strict';

/**
 * This example shows how generators pass options
 * and plugins to child generators
 */

var generators = require('..');
var option = require('base-option');
var Base = require('base');
Base.use(function fn() {
  this.is('app');
  return fn;
});

var base = new Base();
base.use(generators());
base.use(option());
base.option('cwd', 'examples');

base.register('foo', function(foo) {
  this.use(function fn() {
    this.aaa = 'aaa';
    return fn;
  });

  this.option('one', 'one');
  console.log(this.aaa);
  console.log(this.options);

  this.register('bar', function(bar) {
    this.bbb = 'bbb';
    this.option('two', 'two');

    console.log(this.aaa);
    console.log(this.options);

    this.register('baz', function(baz) {
      this.ccc = 'ccc';
      this.option('three', 'three');

      console.log(this.aaa);
      console.log(this.options);

      this.register('qux', function(qux) {
        this.ddd = 'ddd';
        this.option('four', 'four');

        console.log(this.aaa);
        console.log(this.options);

        this.register('fez', function(fez) {
          this.eee = 'eee';
          this.option('five', 'five');

          console.log(this.aaa);
          console.log(this.options);
        });
      });
    });
  });
});

base.getGenerator('foo.bar.baz.qux.fez');
