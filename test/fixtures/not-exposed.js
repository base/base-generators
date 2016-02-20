'use strict';

var generators = require('../..');
var Base = require('base');
Base.use(generators());
var base = new Base();

base.register('not-exposed', function(app) {

});
