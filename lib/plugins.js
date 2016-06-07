'use strict';

var utils = require('./utils');

module.exports = function() {
  return function fn() {
    this.define('isValidInstance', utils.isValidInstance);
    this.use(utils.plugins());

    if (this.isValidInstance(this)) {
      this.use(utils.cwd());
      this.use(utils.pkg());
      this.use(utils.env());
      this.use(utils.option());
      this.use(utils.data());
      this.use(utils.compose());
      this.use(utils.task());
    }
    return fn;
  };
};
