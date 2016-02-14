var postcss = require('postcss');

var functionResolution = require('./');

var testPlugin = postcss.plugin('test-plugin', function(opts) {
  return function(style, result) {
    if (!result.functions) result.functions = [];
    result.functions.push({
      name: opts.name,
      fn: opts.fn
    });
  };
});

var result = postcss()
  .use(testPlugin({
    name: 'foo',
    fn: function(val) {
      return val + '-foo';
    }
  }))
  .use(testPlugin({
    name: 'bar',
    fn: function(val) {
      return val + '-bar';
    }
  }))
  .use(functionResolution())
  .process('element { property: foo(bar(foo(value))); }')
  .css;

console.log(result);
