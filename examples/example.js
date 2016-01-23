'use strict';

var argv = require('minimist')(process.argv.slice(2));
var Generate = require('./');
var app = new Generate({});

app.register('base', function(app) {
  app.extendWith('generators/f');
  app.extendWith('generators/e');

  app.generator('generators/a')
    .config.map('foo', function() {
      console.log('config FOO')
    });

  app.generator('generators/a')
    .config.map('zzz', function() {
      console.log('config ZZZ')
    });

  app.task('process', function(cb) {
    app.generator('generators/i')
      .cli.process(argv, function(err) {
        if (err) return cb(err);

        app.generator('generators/a')
          .config.process({zzz: 'zzz', bar: 'bar'}, cb);
      });
  });
});

app.generate('base', ['process'], function(err) {
  if (err) throw err;
  console.log('done');
});
