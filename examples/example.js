'use strict';

var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var generators = require('..');
var Base = require('base');
Base.use(generators());

var app = new Base();
var cwd = path.resolve.bind(path, __dirname, 'generators');

app.register('base', function(app) {
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

        app.generator(cwd('a'))
          .config.process({zzz: 'zzz', bar: 'bar'}, cb);
      });
  });
});

app.generate('base', ['process'], function(err) {
  if (err) throw err;
  console.log('done');
});
