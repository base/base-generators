
var generators = require('..');
var Base = require('base');
Base.use(function fn() {
  this.isApp = true;
  return fn;
});

// all of the `base` variables below refer
// to this initial instance
var base = new Base();
base.use(generators());

base.register('foo', function(foo, base) {
  // `foo` is "app"
  // `foo.parent` is (also) `base`
  // `foo.base` is `base`
  //
  // namespace => `foo`

  foo.register('bar', function(bar, base) {
    // `bar` is "app"
    // `bar.parent` is `foo`
    // `bar.base` is `base`
    //
    // namespace => `foo.bar`

    bar.register('baz', function(baz, base) {
      // `baz` is "app"
      // `baz.parent` is `bar`
      // `baz.base` is `base`
      //
      // namespace => `foo.bar.baz`

      baz.register('qux', function(qux, base) {
        // `qux` is "app"
        // `quz.parent` is `baz`
        // `qux.base`is `base`
        //
        // namespace => `foo.bar.baz.qux`

      });
    });
  });
});

/**
 * Get a generator
 */

console.log(base)
console.log(base.generator('foo'))
console.log(base.generator('foo.bar'))
console.log(base.generator('foo.bar.baz'))
console.log(base.generator('foo.bar.baz.qux'))

/**
 * See the sub-generators cached on a generator
 */

console.log(base.generators)
//=> { foo: [Getter] }
console.log(base.generator('foo').generators)
//=> { bar: [Getter] }
console.log(base.generator('foo.bar').generators)
//=> { baz: [Getter] }
console.log(base.generator('foo.bar.baz').generators)
//=> { qux: [Getter] }
console.log(base.generator('foo.bar.baz.qux').generators)
//=> {}
