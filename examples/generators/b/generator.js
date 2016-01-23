/*!
 * a <https://github.com/jonschlinkert/a>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var data = require('base-data');

module.exports = function(app) {
  app.use(data());
};
