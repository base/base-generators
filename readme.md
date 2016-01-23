## Usage

```js
var baseGenerators = require('base-generators');
```

## API


Invoke generator `name` with the given `fn`.

**Params**

* `name` **{String}**    
* `fn` **{Function}**: Generator function.    
* `returns` **{Object}**: Returns the instance of Generate for chaining.  






**Params**

* `name` **{String}**: Generator name.    
* `returns` **{Object|undefined}**: Returns the generator or undefined.  

**Example**



```js
app.getGenerator('foo');

// get a sub-generator
app.getGenerator('foo.bar.baz');
```



Register generator `name` with the given `fn`.

**Params**

* `name` **{String}**    
* `fn` **{Function}**: Generator function.    
* `returns` **{Object}**: Returns the instance of Generate for chaining.  




Invoke the given generator in the context of the current instance.

**Params**

* `app` **{String|Object}**: Generator name or instance.    
* `returns` **{Object}**: Returns the instance for chaining.  




Extend the current generator instance with all of the
configuration settings from the given generator.

**Params**

* `app` **{String|Object}**    
* `returns` **{Object}**: Returns the instance for chaining.  



