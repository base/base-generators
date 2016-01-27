'use strict';

var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var generators = require('../../..');

/**
 * Register the `generators` plugin before instantiating `Base`
 */

var Base = require('base');
Base.use(generators());

/**
 * Instantiate
 */

var app = new Base();
var cwd = path.resolve.bind(path, __dirname, '../../generators');

/**
 * Register a generator
 */

app.register('example', function(app) {
  app.extendWith(cwd('f'));
  app.extendWith(cwd('e'));

  app.generator(cwd('a'))
    .config.map('foo', function() {
      console.log('config FOO')
    });

  app.generator(cwd('a'))
    .config.map('zzz', function() {
      console.log('config ZZZ')
    });

  app.task('process', function(cb) {
    app.generator(cwd('i'))
      .cli.process(argv, function(err) {
        if (err) return cb(err);

        console.log('example > process');
        app.generator(cwd('a'))
          .config.process({zzz: 'zzz', bar: 'bar'}, cb);
      });
  });

  app.task('default', function(cb) {
    console.log('example > default');
    cb();
  });
});

/**
 * Generate
 */

app.task('default', function(cb) {
  console.log(this.app.name + ' > ' + this.name);
  app.generate('example', ['process'], function(err) {
    if (err) return cb(err);
    console.log('example > process');
    cb();
  });
});

module.exports = app;
