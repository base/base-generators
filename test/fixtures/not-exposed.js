'use strict';

var generators = require('../..');
var Base = require('base');
var base = new Base({isApp: true});
base.use(generators());

base.register('not-exposed', function(app) {

});
