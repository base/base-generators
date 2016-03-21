'use strict';

var Base = require('base');
var cwd = require('base-cwd');
var plugins = require('base-plugins');
var option = require('base-option');
var task = require('base-task');

var App = module.exports = function App() {
  Base.call(this);
  this.use(cwd());
  this.use(plugins());
  this.use(option());
  this.use(task());
};

Base.extend(App);
