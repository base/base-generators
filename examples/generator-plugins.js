'use strict';

/**
 * This example shows how generators pass options
 * and plugins to child generators
 */

var option = require('base-option');
var Base = require('base');
var generators = require('..');

Base.use(generators());

var base = new Base();
base.use(option());

base.option('cwd', 'examples');

base.generators.set('foo', function(foo) {
  this.use(function fn() {
    this.aaa = 'aaa';
    return fn;
  });

  this.option('one', 'one');
  console.log(this.aaa);
  console.log(this.options);

  this.generators.set('bar', function(bar) {
    this.use(function() {
      this.bbb = 'bbb';
    });

    this.option('two', 'two');
    console.log(this.aaa);
    console.log(this.options);

    this.generators.set('baz', function(baz) {
      this.use(function() {
        this.ccc = 'ccc';
      });

      this.option('three', 'three');
      console.log(this.aaa);
      console.log(this.options);

      this.generators.set('qux', function(qux) {
        this.use(function() {
          this.ddd = 'ddd';
        });

        this.option('four', 'four');
        console.log(this.aaa);
        console.log(this.options);

        this.generators.set('fez', function(fez) {
          this.use(function() {
            this.eee = 'eee';
          });

          this.option('five', 'five');
          console.log(this.aaa);
          console.log(this.options);
        });
      });
    });
  });
});

base.getGenerator('foo.bar.baz.qux.fez');
