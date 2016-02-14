var postcss = require('postcss');
var balanced = require('balanced-match');

function resolveFunctions(functions, value) {
  var result = balanced('(', ')', value);

  if (!result) {
    return value;
  } else {
    result.body = resolveFunctions(functions, result.body);
  }

  functions.forEach(function(fn) {
    if (result.pre === fn.name) {
      value = fn.fn(result.body);
    }
  });

  return value;
}

module.exports = postcss.plugin('postcss-function-resolution', function() {
  return function(style, result) {
    if (!result.functions) {
      return;
    }

    style.walkDecls(function(node) {
      node.value = resolveFunctions(result.functions, node.value);
    });
  };
});
