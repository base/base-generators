'use strict';

var generators = require('../..');
var Base = require('base');
Base.use(generators(Base));
var base = new Base();

base.register('not-exposed', function(app) {

});
