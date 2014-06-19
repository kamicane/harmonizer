'use strict';

var { nodes } = require('nodes');

var { getUniqueName } = require('./id');
var { express } = require('./string');

exports.getArgumentsId = (node) => {
  if (!node.argumentsId) {
    var argumentsName = getUniqueName(node, '_arguments');
    var declaration = express(`var ${argumentsName} = arguments`);
    var id = declaration.declarations[0].id;
    var body = nodes.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.argumentsId = id;
  }

  return node.argumentsId;
};
