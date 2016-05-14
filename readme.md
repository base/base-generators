# base-generators [![NPM version](https://img.shields.io/npm/v/base-generators.svg?style=flat)](https://www.npmjs.com/package/base-generators) [![NPM downloads](https://img.shields.io/npm/dm/base-generators.svg?style=flat)](https://npmjs.org/package/base-generators) [![Build Status](https://img.shields.io/travis/node-base/base-generators.svg?style=flat)](https://travis-ci.org/node-base/base-generators)

Adds project-generator support to your `base` application.

You might also be interested in [base-task](https://github.com/node-base/base-task).

## TOC

- [Install](#install)
- [Usage](#usage)
- [Examples](#examples)
  * [Tasks](#tasks)
  * [Generators](#generators)
  * [Sub-generators](#sub-generators)
- [In the wild](#in-the-wild)
- [API](#api)
- [Related projects](#related-projects)
- [Contributing](#contributing)
- [Building docs](#building-docs)
- [Running tests](#running-tests)
- [Author](#author)
- [License](#license)

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install base-generators --save
```

## Usage

```js
var generators = require('base-generators');
var Base = require('base');

// register the plugin before instantiating, to make 
// sure the plugin is called on all Generator instances 
Base.use(generators());
var base = new Base();
```

## Examples

All examples assume the following code is defined:

```js
var Base = require('base');
var generators = require('base-generators');

Base.use(generators());
var base = new Base();
```

### Tasks

Tasks are exactly the same as [gulp](http://gulpjs.com) tasks, and are powered by [bach](https://github.com/gulpjs/bach) and [composer](https://github.com/doowb/composer).

**Register a task:**

```js
base.task('default', function(cb) {
  // do stuff
  cb();
});
```

**Run a task:**

```js
base.build('default', function(err) {
  if (err) throw err;
});
```

### Generators

> I heard you liked tasks, so I put some tasks in your tasks.

**What's a generator?**

Generators are functions that are registered by name, and are used to encapsulate and organize code, [tasks](#tasks), other generators, or [sub-generators](#sub-generators), in a sharable, publishable and easily re-usable way.

In case it helps, here are some [live examples](#in-the-wild).

**Register a generator:**

```js
base.register('foo', function(app, base) {
  // `app` is the generator's "private" instance
  // `base` is a "shared" instance, accessible by all generators
});
```

**Get a generator:**

```js
var foo = base.generator('foo');
```

**Register tasks in a generator:**

```js
base.register('foo', function(app, base) {
  app.task('default', function() {});
  app.task('one', function() {});
  app.task('two', function() {});
});
```

**Run a generator's tasks:**

The `.generate` method simply calls the `.build` method on a specific generator.

To run a generator's tasks, pass the generator name as the first argument, and optionally define one or more tasks as the second argument. _(If no tasks are defined, the `default` task is run.)_

```js
// run the "default" task on generator "foo"
base.generate('foo', function(err) {
  if (err) throw err;
  console.log('done!');
});

// or specify tasks
base.generate('foo', ['default'], function() {});
base.generate('foo', ['one', 'two'], function() {});
```

Alternatively, you can call `.build` on the generator directly:

```js
// run the "default" task on generator "foo"
base.generator('foo')
  .build('default', function(err) {
    if (err) throw err;
  });
```

### Sub-generators

Sub-generators are just generators that are registered on (or invoked within) another generator instance.

**Register sub-generators:**

Register generators `one`, `two`, and `three` on generator `foo`:

```js
base.register('foo', function(app, base) {
  app.register('one', function() {});
  app.register('two', function() {});
  app.register('three', function() {});
});
```

**Get a sub-generator:**

Use dot-notation to get a sub-generator:

```js
var one = base.generator('foo.one');
```

Sub-generators may be nested to any level. In reality, you probably won't write code like the following example, but this only illustrates the point that generators are extremely composable, and can be built on top of or with other generators.

```js
base.register('a', function(a, base) {
  // do stuff
  a.register('b', function(b) {
    // do stuff
    b.register('c', function(c) {
      // do stuff
      c.register('d', function(d) {
        // do stuff
        d.register('e', function(e) {
          // arbitrary task
          e.task('default', function(cb) {
            console.log('e > default!');
            cb();
          });
        });
      });
    });
  });
});

base.getGenerator('a.b.c.d.e')
  .build(function(err) {
    if (err) throw err;
    // 'e > default!'
  });
```

**Register tasks on sub-generators:**

```js
base.register('foo', function(app, base) {
  app.register('one', function(one) {
    one.task('default', function() {});
    one.task('a', function() {});
    one.task('b', function() {});
    one.task('c', function() {});
  });

  app.register('two', function(two) {
    two.task('default', function() {});
  });

  app.register('three', function(three) {
    three.task('default', function() {});
  });
});
```

**Run a sub-generator's tasks**

```js
// run the `default` task from sub-generator `foo.one`
base.generate('foo.one', function(err) {
  if (err) throw err;
  console.log('done!');
});
```

**Run multiple tasks on a sub-generator:**

```js
// run tasks `a`, `b` and `c` on sub-generator `foo.one`
base.generate('foo.one', ['a', 'b', 'c'], function(err) {
  if (err) throw err;
  console.log('done!');
});
```

## In the wild

Checked off as they're added:

* [ ] generate: adds a CLI, template rendering, fs methods and generator convenience-methods to base-generators
* [ ] assemble: site generation
* [ ] verb: documentation generation
* [ ] update: renames generators to "updaters", which are used to keep your project up-to-date

## API

### [.register](index.js#L72)

Alias to `.setGenerator`.

**Params**

* `name` **{String}**: The generator's name
* `options` **{Object|Function|String}**: or generator
* `generator` **{Object|Function|String}**: Generator function, instance or filepath.
* `returns` **{Object}**: Returns the generator instance.

**Example**

```js
base.register('foo', function(app, base) {
  // "app" is a private instance created for the generator
  // "base" is a shared instance
});
```

### [.generator](index.js#L97)

Get and invoke generator `name`, or register generator `name` with the given `val` and `options`, then invoke and return the generator instance. This method differs from `.register`, which lazily invokes generator functions when `.generate` is called.

**Params**

* `name` **{String}**
* `fn` **{Function|Object}**: Generator function, instance or filepath.
* `returns` **{Object}**: Returns the generator instance or undefined if not resolved.

**Example**

```js
base.generator('foo', function(app, base, env, options) {
  // "app" - private instance created for generator "foo"
  // "base" - instance shared by all generators
  // "env" - environment object for the generator
  // "options" - options passed to the generator
});
```

### [.setGenerator](index.js#L129)

Store a generator by file path or instance with the given `name` and `options`.

**Params**

* `name` **{String}**: The generator's name
* `options` **{Object|Function|String}**: or generator
* `generator` **{Object|Function|String}**: Generator function, instance or filepath.
* `returns` **{Object}**: Returns the generator instance.

**Example**

```js
base.setGenerator('foo', function(app, base) {
  // "app" - private instance created for generator "foo"
  // "base" - instance shared by all generators
  // "env" - environment object for the generator
  // "options" - options passed to the generator
});
```

### [.getGenerator](index.js#L175)

Get generator `name` from `app.generators` and invoke it with the current instance. Dot-notation may be used to get a sub-generator.

**Params**

* `name` **{String}**: Generator name.
* `returns` **{Object|undefined}**: Returns the generator instance or undefined.

**Example**

```js
var foo = app.getGenerator('foo');

// get a sub-generator
var baz = app.getGenerator('foo.bar.baz');
```

### [.findGenerator](index.js#L216)

Find generator `name`, by first searching the cache, then searching the cache of the `base` generator. Use this to get a generator without invoking it.

**Params**

* `name` **{String}**
* `options` **{Function}**: Optionally supply a rename function on `options.toAlias`
* `returns` **{Object|undefined}**: Returns the generator instance if found, or undefined.

**Example**

```js
// search by "alias"
var foo = app.findGenerator('foo');

// search by "full name"
var foo = app.findGenerator('generate-foo');
```

### [.getSubGenerator](index.js#L271)

Get sub-generator `name`, optionally using dot-notation for nested generators.

**Params**

* `name` **{String}**: The property-path of the generator to get
* `options` **{Object}**

**Example**

```js
app.getSubGenerator('foo.bar.baz');
```

Iterate over `app.generators` and call `generator.isMatch(name)`
on `name` until a match is found.

**Params**

* `name` **{String}**
* `returns` **{Object|undefined}**: Returns a generator object if a match is found.

For example, if the lookup `name` is `foo`, the function might
return `["generator-foo", "foo"]`, to ensure that the lookup happens
in that order.

**Params**

* `name` **{String}**: Generator name to search for
* `options` **{Object}**
* `fn` **{Function}**: Lookup function that must return an array of names.
* `returns` **{Object}**

### [.extendWith](index.js#L379)

Extend the generator instance with settings and features of another generator.

**Params**

* `app` **{String|Object}**
* `returns` **{Object}**: Returns the instance for chaining.

**Example**

```js
var foo = base.generator('foo');
base.extendWith(foo);
// or
base.extendWith('foo');
// or
base.extendWith(['foo', 'bar', 'baz']);

app.extendWith(require('generate-defaults'));
```

### [.generateEach](index.js#L509)

Iterate over an array of generators and tasks, calling [generate](#generate) on each.

**Params**

* `tasks` **{String|Array}**: Array of generators and tasks to run.
* `cb` **{Function}**: Callback function that exposes `err` as the only parameter.

**Example**

```js
// run tasks `a` and `b` on generator `foo`,
// and tasks `c` and `d` on generator `bar`
base.generateEach(['foo:a,b', 'bar:c,d'], function(err) {
  if (err) throw err;
});
```

### [runGenerators](index.js#L606)

Run generators, calling `.config.process` first if it exists.

**Params**

* `name` **{String|Array}**: generator to run
* `tasks` **{Array|String}**: tasks to run
* `app` **{Object}**: Application instance
* `generator` **{Object}**: generator instance
* **{Function}**: next

### [.toAlias](index.js#L707)

Create a generator alias from the given `name`. By default the alias is the string after the last dash. Or the whole string if no dash exists.

**Params**

* `name` **{String}**
* `options` **{Object}**
* `returns` **{String}**: Returns the alias.

**Example**

```js
var camelcase = require('camel-case');
var alias = app.toAlias('foo-bar-baz');
//=> 'baz'

// custom `toAlias` function
app.option('toAlias', function(name) {
  return camelcase(name);
});
var alias = app.toAlias('foo-bar-baz');
//=> 'fooBarBaz'
```

### [.alias](lib/app.js#L52)

Get the generator `alias` created by calling the `app.toAlias` function.

* `returns` **{String}**: Returns the value from `generator.env.alias`

**Example**

```js
console.log(generator.alias);
```

### [.name](lib/app.js#L83)

Get the `name` that was used to originally registered the generator.

* `returns` **{String}**: Returns the value from `generator.env.name`

**Example**

```js
var app = new Base();
var foo = app.register('foo', function() {});
console.log(foo.name);
//=> 'foo'
var bar = foo.register('bar', function() {});
console.log(bar.name);
//=> 'bar'
var baz = bar.register('baz', function() {});
console.log(baz.name);
//=> 'baz'
```

### [.namespace](lib/app.js#L114)

Get a generator's `namespace`, which created from the generator's parent `namespace` plus the generator's `alias`.

* `returns` **{String}**: Returns the value from `generator.env.namespace`

**Example**

```js
var foo = app.register('foo', function() {});
console.log(foo.namespace);
//=> 'foo'
var bar = foo.register('bar', function() {});
console.log(bar.namespace);
//=> 'foo.bar'
var baz = bar.register('baz', function() {});
console.log(baz.namespace);
//=> 'foo.bar.baz'
```

### [.invoke](lib/app.js#L141)

Invoke `generator.fn` with the given `options` and optional `context`.

**Params**

* `options` **{Object}**
* `context` **{Object}**
* `returns` **{Object}**: Returns the context object or generator instance, modified by invoking `fn`.

**Example**

```js
generator.invoke();
```

### [.isMatch](lib/app.js#L160)

Returns true if `str` matches one of the following properties on `generator.env` - `key`: the original name used to register the generator - `name`: the name of the generator. this can be different than `key` if the generator was registered using a filepath. - `path`: the file path of the generator.

**Params**

* `str` **{String}**
* `returns` **{Boolean}**

**Example**

```js
var isMatch = generator.isMatch('foo/bar.js');
```

### [.generateEach](lib/generate.js#L109)

Iterate over an array of generators and tasks, calling [generate](#generate) on each.

**Params**

* `tasks` **{String|Array}**: Array of generators and tasks to run.
* `cb` **{Function}**: Callback function that exposes `err` as the only parameter.

**Example**

```js
// run tasks `a` and `b` on generator `foo`,
// and tasks `c` and `d` on generator `bar`
base.generateEach(['foo:a,b', 'bar:c,d'], function(err) {
  if (err) throw err;
});
```

### [runGenerators](lib/generate.js#L213)

Run generators, calling `.config.process` first if it exists.

**Params**

* `name` **{String|Array}**: generator to run
* `tasks` **{Array|String}**: tasks to run
* `app` **{Object}**: Application instance
* `generator` **{Object}**: generator instance
* **{Function}**: next

### [.hasTask](lib/tasks.js#L115)

Return true if task `name` exists on `app.tasks`.

**Params**

* `name` **{String}**: Task name to check

**Example**

```js
app.task('foo', function() {});
console.log(app.hasTask('foo'));
//=> true
```

## Related projects

You might also be interested in these projects:

* [bach](https://www.npmjs.com/package/bach): Compose your async functions with elegance | [homepage](https://github.com/gulpjs/bach)
* [base-fs](https://www.npmjs.com/package/base-fs): base-methods plugin that adds vinyl-fs methods to your 'base' application for working with the file… [more](https://www.npmjs.com/package/base-fs) | [homepage](https://github.com/node-base/base-fs)
* [base-pipeline](https://www.npmjs.com/package/base-pipeline): base-methods plugin that adds pipeline and plugin methods for dynamically composing streaming plugin pipelines. | [homepage](https://github.com/node-base/base-pipeline)
* [base-plugins](https://www.npmjs.com/package/base-plugins): Upgrade's plugin support in base applications to allow plugins to be called any time after… [more](https://www.npmjs.com/package/base-plugins) | [homepage](https://github.com/node-base/base-plugins)
* [base-task](https://www.npmjs.com/package/base-task): base plugin that provides a very thin wrapper around [https://github.com/doowb/composer](https://github.com/doowb/composer) for adding task methods to… [more](https://www.npmjs.com/package/base-task) | [homepage](https://github.com/node-base/base-task)
* [base](https://www.npmjs.com/package/base): base is the foundation for creating modular, unit testable and highly pluggable node.js applications, starting… [more](https://www.npmjs.com/package/base) | [homepage](https://github.com/node-base/base)
* [composer](https://www.npmjs.com/package/composer): API-first task runner with three methods: task, run and watch. | [homepage](https://github.com/doowb/composer)
* [gulp](https://www.npmjs.com/package/gulp): The streaming build system | [homepage](http://gulpjs.com)

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/node-base/base-generators/issues/new).

## Building docs

Generate readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install verb && npm run docs
```

Or, if [verb](https://github.com/verbose/verb) is installed globally:

```sh
$ verb
```

## Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

## Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2016, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT license](https://github.com/node-base/base-generators/blob/master/LICENSE).

***

_This file was generated by [verb](https://github.com/verbose/verb), v0.9.0, on May 14, 2016._