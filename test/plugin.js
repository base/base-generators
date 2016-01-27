'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var generators = require('..');
var base;

describe('plugin', function() {
  beforeEach(function() {
    Base.use(generators());
    base = new Base();
  });

  it('should register as a plugin on `base`', function()  {
    assert.equal(base.isRegistered('base-generators'), true);
  });
});
