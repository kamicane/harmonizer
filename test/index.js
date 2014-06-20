/* jshint strict:false, evil:true */

// This main test file (which is run in mocha),
// reads the es6 source (which is a mocha test),
// compiles it at runtime and evaluates it.
// As opposed to just compiling the tests,
// this gives us test coverage.

var fs = require('fs');
var path = require('path');
var esprima = require('esprima');
var escodegen = require('escodegen');
var glob = require('glob');

var harmonize = require('../');

glob.sync('./transform/*.js').forEach(function(file) {
  var source = fs.readFileSync(path.join(__dirname, file)).toString();
  var ast = esprima.parse(source);
  var harmonized = harmonize(ast);
  var code = escodegen.generate(harmonized);

  eval(code);
});
