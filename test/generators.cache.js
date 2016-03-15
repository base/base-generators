// 'use strict';

// require('mocha');
// var assert = require('assert');
// var option = require('base-option');
// var Base = require('base');
// var base;

// var cache = require('../lib/cache');
// var generators = require('..');

// describe('cache', function() {
//   describe('plugin', function() {
//     it('should work as a plugin', function() {
//       base = new Base();
//       base.use(cache());
//       assert(base.hasOwnProperty('generators'));
//     });

//     it('should only register the plugin once', function(cb) {
//       base = new Base();
//       base.registered = {};

//       var count = 0;
//       base.on('plugin', function() {
//         count++;
//       });

//       base.use(cache());
//       base.use(cache());
//       base.use(cache());
//       base.use(cache());
//       base.use(cache());
//       assert.equal(count, 1);
//       cb();
//     });
//   });

//   describe('set', function() {
//     beforeEach(function() {
//       Base.use(generators(Base));
//       base = new Base();
//       base.use(option());
//     });

//     it('should set an instance', function() {
//       base.generators.set('foo', function() {});
//       assert(base.generators.hasOwnProperty('foo'));
//     });

//     it('should set an instance with a parent instance', function() {
//       base.generators.set('foo', function() {});
//       assert(base.generators.hasOwnProperty('foo'));
//     });

//     it('should set options from the parent instance on new instances', function() {
//       base = new Base({options: {a: 'b'}});
//       assert.equal(base.options.a, 'b');

//       base.generators.set('foo', function() {});
//       assert(base.generators.hasOwnProperty('foo'));
//       assert.equal(base.generators.foo.options.a, 'b');
//     });

//     it('should set options from the parent instance on sub-generators', function(cb) {
//       base = new Base({options: {a: 'b'}});
//       assert.equal(base.options.a, 'b');

//       base.generators.set('foo', function(app) {
//         app.generators.set('bar', function(bar) {
//           assert.equal(bar.options.a, 'b');
//           cb();
//         });
//       });

//       base.getGenerator('foo.bar');
//     });

//     it('should set parent options on deeply nested sub-generators', function(cb) {
//       base = new Base({options: {a: 'b'}});
//       base.use(option());

//       assert.equal(base.options.a, 'b');

//       base.option('c', 'd');

//       base.generators.set('foo', function(foo) {
//         assert.equal(foo.options.a, 'b');

//         foo.generators.set('bar', function(bar) {
//           assert.equal(bar.options.a, 'b');

//           bar.generators.set('baz', function(baz) {
//             assert.equal(baz.options.a, 'b');

//             baz.generators.set('qux', function(qux) {
//               assert.equal(qux.options.a, 'b');

//               qux.generators.set('fez', function(fez) {
//                 assert.equal(fez.options.a, 'b');

//                 cb();
//               });
//             });
//           });
//         });
//       });
//       base.getGenerator('foo.bar.baz.qux.fez');
//     });

//     it('should expose the base instance as the second arg', function(cb) {
//       base = new Base({options: {a: 'b'}});
//       base.use(option());

//       assert.equal(base.options.a, 'b');

//       base.option('c', 'd');

//       base.generators.set('foo', function(foo, fooBase) {
//         foo.generators.set('bar', function(bar, barBase) {
//           bar.generators.set('baz', function(baz, bazBase) {
//             baz.generators.set('qux', function(qux, quxBase) {
//               qux.generators.set('fez', function(fez, fezBase) {
//                 assert(fezBase.hasGenerator('foo'));
//                 assert(!fezBase.hasGenerator('bar'));
//                 assert(fezBase.hasGenerator('foo.bar'));
//                 cb();
//               });
//             });
//           });
//         });
//       });
//       base.getGenerator('foo.bar.baz.qux.fez');
//     });

//     it('should not merge generator options back upstream', function() {
//       base = new Base({options: {a: 'b'}});
//       base.use(option());

//       assert.equal(base.options.a, 'b');

//       base.generators.set('foo', function() {});
//       base.option('one', 'two');

//       var foo = base.getGenerator('foo');
//       foo.option('x', 'z');

//       assert.equal(foo.options.a, 'b');
//       assert.equal(foo.options.x, 'z');
//       assert.equal(typeof base.options.x, 'undefined');
//     });

//     it('should break the options reference after instantiation', function() {
//       base = new Base({options: {a: 'b'}});
//       base.use(option());

//       assert.equal(base.options.a, 'b');

//       base.generators.set('foo', function() {});
//       base.option('one', 'two');

//       var foo = base.getGenerator('foo');
//       assert.equal(foo.options.a, 'b');
//       assert.equal(typeof foo.options.one, 'undefined');
//     });
//   });

//   describe('get', function() {
//     beforeEach(function() {
//       Base.use(generators(Base));
//       base = new Base();
//     });

//     it('should get an instance from app.generators', function() {
//       base.generators.set('foo', function() {});
//       var foo = base.generators.get('foo');
//       assert(foo);
//       assert(foo.isGenerator);
//     });
//   });

//   describe('plugins', function() {
//     beforeEach(function() {
//       Base.use(generators(Base));
//       base = new Base();
//     });

//     it('should add plugins from a parent generator to child generators', function() {
//       base.use(option());

//       base.generators.set('foo', function() {});
//       var foo = base.generators.get('foo');
//       assert(foo);
//       assert(foo.hasOwnProperty('option'));
//       assert.equal(typeof foo.option, 'function');
//     });

//     it('should add parent plugins to deeply nested generators', function(cb) {
//       base.use(option());

//       base.generators.set('foo', function(foo) {
//         foo.use(function fn() {
//           this.aaa = 'aaa';
//           return fn;
//         });

//         assert.equal(this.aaa, 'aaa');
//         assert.equal(typeof this.option, 'function');

//         foo.generators.set('bar', function(bar) {
//           bar.use(function() {
//             this.bbb = 'bbb';
//           });

//           assert.equal(this.aaa, 'aaa');
//           assert.equal(typeof this.option, 'function');

//           bar.generators.set('baz', function(baz) {
//             baz.use(function fn() {
//               this.ccc = 'ccc';
//               return fn;
//             });

//             assert.equal(this.aaa, 'aaa');
//             assert.equal(typeof this.option, 'function');

//             baz.generators.set('qux', function(qux) {
//               qux.use(function() {
//                 this.ddd = 'ddd';
//               });

//               assert.equal(this.ccc, 'ccc');
//               assert.equal(this.aaa, 'aaa');
//               assert.equal(typeof this.option, 'function');

//               qux.generators.set('fez', function(fez) {
//                 fez.use(function() {
//                   this.eee = 'eee';
//                 });

//                 assert.equal(this.ccc, 'ccc');
//                 assert.equal(this.aaa, 'aaa');
//                 assert.equal(typeof this.option, 'function');

//                 cb();
//               });
//             });
//           });
//         });
//       });

//       base.getGenerator('foo.bar.baz.qux.fez');
//     });
//   });
// });
