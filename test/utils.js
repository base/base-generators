'use strict';

require('mocha');
var assert = require('assert');
var utils = require('../lib/utils');

describe('utils', function() {
  describe('utils.normalizeTasks', function() {
    it('should normalize name string and tasks array', function() {
      var tasks = utils.normalizeTasks('foo', ['a', 'b', 'c']);
      assert.deepEqual(tasks, ['foo:a,b,c']);
    });

    it('should normalize name with dot-notation', function() {
      var tasks = utils.normalizeTasks('foo.sub', ['a', 'b', 'c']);
      assert.deepEqual(tasks, ['foo.sub:a,b,c']);
    });

    it('should normalize name string and tasks string', function() {
      var tasks = utils.normalizeTasks('foo', 'bar');
      assert.deepEqual(tasks, ['foo:bar']);
    });

    it('should normalize name array', function() {
      var tasks = utils.normalizeTasks(['foo', 'bar']);
      assert.deepEqual(tasks, ['foo', 'bar']);
    });

    it('should add default task to empty tasks array', function() {
      var tasks = utils.normalizeTasks('foo', []);
      assert.deepEqual(tasks, ['foo:default']);
    });
  });

  // describe('utils.parseTasks', function() {
  //   it('should normalize name string and tasks array', function() {
  //     var str = utils.normalizeTasks('foo', ['a', 'b', 'c']);
  //     var tasks = utils.parseTasks(str);
  //     console.log(tasks);
  //     // assert.equal(tasks, ['foo:a,b,c']);
  //   });

  //   it('should normalize name with dot-notation', function() {
  //     var str = utils.normalizeTasks('foo.sub', ['a', 'b', 'c']);
  //     var tasks = utils.parseTasks(str);
  //     console.log(tasks);
  //     // assert.equal(tasks, ['foo.sub:a,b,c']);
  //   });

  //   it('should normalize name string and tasks string', function() {
  //     var str = utils.normalizeTasks('foo', 'bar');
  //     var tasks = utils.parseTasks(str);
  //     console.log(tasks);
  //     // assert.equal(tasks, ['foo:bar']);
  //   });

  //   it('should normalize name array', function() {
  //     var str = utils.normalizeTasks(['foo', 'bar']);
  //     var tasks = utils.parseTasks(str);
  //     console.log(tasks);
  //     // assert.deepEqual(tasks, ['foo', 'bar']);
  //   });
  // });
});

