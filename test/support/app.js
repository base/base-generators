'use strict';

var Base = require('base');
var task = require('base-task');

function App() {
  this.isApp = true;
  Base.call(this);
  this.use(task());
}

Base.extend(App);

/**
 * Expose `App`
 */

module.exports = App;
