# postcss-function-resolution

> Demo repo showing order-independent function resolution for PostCSS.

### Explanation

It's fairly trivial to create functions in PostCSS using
[`reduce-function-call`](https://github.com/MoOx/reduce-function-call).

```css
element {
  property: func(value);
}
```

However, you run into problems with this when you are trying to reduce nested
function calls into a single value.

```css
element {
  property: foo(bar(value));
}
```

Now the ability to resolve this to a single value depends on the order of the
plugins that are run. In the above example, if `postcss-foo` is run before
`postcss-bar` then it will cause an error.

However, there are immediately two scenarios where this will break:

```css
element {
  property: foo(bar(foo(value)));
  property: bar(foo(value));
}
```

The solution to this is to add the ability to resolve these "expressions" so
that the order of the plugin doesn't matter, but instead the order of which
these functions are called.

So how is this solved in other compilers/interpreters?

Well typically a language AST goes into far more detail than one for CSS (due to
the nature of CSS). instead of just a `Declaration` with a `string` as a
property `value`, an AST for a language like JavaScript would represent it
similar to this:

```js
{
  type: Declaration,
  value: {
    type: Expression,
    expression: {
      type: CallExpression,
      callee: {
        type: Identifier,
        name: 'foo'
      },
      arguments: [{
        type: CallExpression,
        callee:{
          type: Identifier,
          name: 'bar'
        },
        arguments: [{
          ...
        }]
      }]
    }
  }
}
```

From there a compiler (or more correctly an interpreter), would start folding
this `Expression` depth-first and resolving the calls however it can.

Now, I'm not sure if PostCSS wants to dive into creating an AST for all CSS
values, as that adds a ton of complexity to what is currently extremely simple.
Although, most modern compiler authors would this is the most sustainable
solution. So if you're up for it, I would suggest it.

However, in case thats not the solution that PostCSS wants to take, I'll instead
offer an alternative solution where PostCSS plugins can add resolutions for
plugins.

If plugins pushed to a pipeline of functions to resolve instead of manipulating
the AST right away, something could resolve them later on (Which is what this
repo demonstrates).

For example, imagine a plugin like this:

```js
postcss.plugin('plugin', function(opts) {
  return function(style, result) {
    if (!result.functions) result.functions = [];
    result.functions.push({
      name: opts.name,
      fn: opts.fn
    });
  };
});
```

We'll then use them like this:

```js
var result = postcss()
  .use(testPlugin({ name: 'foo', fn: val => `${val}-foo` }))
  .use(testPlugin({ name: 'bar', fn: val => `${val}-bar` }))
  .process('element { property: foo(bar(foo(value))); }')
  .css;
```

We want this to resolve to:

```css
element { property: value-foo-bar-foo; }
```

> Notice how the suffixes are in the order that the functions were called.

Now these plugins don't do anything on their own, but if something grabbed
`result.functions`, it could resolve them at a later stage. This could either be
PostCSS or another plugin:

```js
var result = postcss()
  .use(testPlugin({ name: 'foo', fn: val => `${val}-foo` }))
  .use(testPlugin({ name: 'bar', fn: val => `${val}-bar` }))
  .use(functionResolution())
  .process('element { property: foo(bar(foo(value))); }')
  .css;
```

Now we get our expected result:

```css
element { property: value-foo-bar-foo; }
```

This repo demonstrates exactly how to do that. If you want to try it out, clone
this repo and run the following:

```
$ npm install
$ npm test
```
