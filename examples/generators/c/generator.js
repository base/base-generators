'use strict';

var path = require('path');

module.exports = function(app, opts) {
  app.extendWith(path.resolve(__dirname, '../b'));

  app.data({site: {title: 'Foo'}});

  app.task('default', function(cb) {
    console.log('c > default');
    cb();
  });
};
