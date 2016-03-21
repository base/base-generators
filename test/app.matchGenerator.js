'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Base = require('./support/app');
var option = require('base-option');
var generators = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

describe('.matchGenerator', function() {
  beforeEach(function() {
    Base.use(generators(Base));
    Base.use(option());
    base = new Base();

    base.option('alias', function(key) {
      return key.replace(/^generate-(.*)/, '$1');
    });
  });

  it('should match a generator by name', function() {
    base.register('generate-foo');

    var gen = base.matchGenerator('generate-foo');
    assert(gen);
    assert.equal(gen.env.name, 'generate-foo');
    assert.equal(gen.env.alias, 'foo');
  });

  it('should match a generator by alias', function() {
    base.register('generate-foo');

    var gen = base.matchGenerator('foo');
    assert(gen);
    assert.equal(gen.env.name, 'generate-foo');
    assert.equal(gen.env.alias, 'foo');
  });

  it('should match a generator by path', function() {
    base.register('generate-foo');

    var gen = base.matchGenerator(require.resolve('generate-foo'));
    assert(gen);
    assert.equal(gen.env.name, 'generate-foo');
    assert.equal(gen.env.alias, 'foo');
  });
});
