'use strict';

var runtimes = require('base-runtimes');
var task = require('base-task');
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
