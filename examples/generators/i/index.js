/*!
 * a <https://github.com/jonschlinkert/a>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var cli = require('base-cli');

module.exports = function(app) {
  app.use(cli());

  app.cli.map('abc', function(val) {
    console.log(val);
  });
};
