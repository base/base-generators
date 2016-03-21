'use strict';

var Base = require('base');
var plugins = require('base-plugins');
var option = require('base-option');
var task = require('base-task');

var App = module.exports = function App() {
  Base.call(this);
  this.use(plugins());
  this.use(option());
  this.use(task());
};

Base.extend(App);
