'use strict';

var debug = require('debug')('base:generators:plugins');
var plugins = require('lazy-cache')(require);
var fn = require;
require = plugins; // eslint-disable-line

/**
 * Plugins
 */

require('base-cwd', 'cwd');
require('base-env', 'env');
require('base-plugins', 'plugin');
require('base-resolver', 'resolver');
require('base-task', 'task');
require = fn; // eslint-disable-line

/**
 * Expose `plugins`
 */

module.exports = plugins;
