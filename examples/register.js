'use strict';

// require('time-require');
var task = require('base-task');
var assemble = require('assemble-core');
var register = require('../register');

// register(assemble, {
//   aliasFn: function(name, env) {
//     return name.replace(/^verb-(.*)-generator?$/, '$1');
//   }
// });

// var app = assemble();

function Generate() {
  assemble.call(this);
}
register(assemble, {
  aliasFn: function(name, env) {
    return name.replace(/^verb-(.*)-generator?$/, '$1');
  }
});
assemble.extend(Generate);

var app = new Generate();
app.use(task());

// app.registerGlob('verb-*-generator');

// app.register('foo', function() {});
// app.register('bar', 'foo');
// var gen = app.getGenerator('bar');

// app.register('verb-readme-generator', function() {});

// glob.sync('verb-*-generator', {cwd: gm})
//   .forEach(function(file) {
//     app.register(path.basename(file), resolve.sync(file));
//   });

// app.register('fixtures/verb-readme-generator');
// var gen = app.getGenerator('readme');
// console.log(gen);

app.register('zzz', function zfn(zzz, base) {
  console.log('invoking', zzz.namespace);
  zzz.task('default', function(cb) {
    console.log('zzz');
    cb();
  });

  zzz.register('aaa', function(aaa) {
    console.log('aaa');

    aaa.task('default', function(cb) {
      console.log('running >', this.name);
      cb();
    });
  });
  return zfn;
});

app.register('foo', function(foo) {
  foo.extendWith('zzz');
  // foo.register('zzz', 'zzz');

  // console.log(foo)
  // foo.use(function fn(sub) {
  //   sub.register('zzz');
  //   return fn;
  // });

  foo.use(function fn(a) {
    // console.log('HEY');
    a.b = 'c';
    return fn;
  });

  foo.register('bar', function(bar) {
    bar.register('baz', function(baz) {
      baz.whatever = 'blah';
    });
  });
});


var gen = app.getGenerator('foo.bar.baz.aaa');
gen.build(function() {})


// var gen = app.getGenerator(path.resolve(__dirname, '../fixtures/verb-readme-generator'));
// var gen = app.getGenerator('verb-readme-generator');
// console.log(gen.env.name);
