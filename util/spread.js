'use strict';

var { nodes } = require('nodes');

var { getUniqueName } = require('./id');
var { express } = require('./string');

var spread = `function() {
  var array = [], last = arguments.length - 1;
  for (var i = 0; i < last; i++) array.push(arguments[i]);
  var iterator = arguments[last]['@@iterator'](), step;
  while (!(step = iterator.next()).done) array.push(step.value);
  return array;
}`;

exports.getSpreadId = (node) => {
  if (!node.spreadId) {
    var spreadName = getUniqueName(node, 'spread');
    var declaration = express(`var ${spreadName} = ${spread}`);
    var id = declaration.declarations[0].id;
    var body = nodes.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.spreadId = id;
  }

  return node.spreadId;
};
