'use strict';

require('time-require');

var time = require('time-diff')();
var runtimes = require('composer-runtimes');
var task = require('base-tasks');
var Base = require('base');
var app = new Base();

// register plugins
app.use(task());
app.use(runtimes());

app.task('default', function(cb) {
  cb();
});

// run the `default` task
app.build(function(err) {
  if (err) throw err;
});
