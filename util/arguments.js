'use strict';

var { getUniqueName } = require('./id');
var { express } = require('./string');
var { insertAfterStrict } = require('./insertion');

exports.getArgumentsId = (node) => {
  if (!node.argumentsId) {
    var argumentsName = getUniqueName(node, '_arguments');
    var declaration = express(`var ${argumentsName} = arguments`);
    insertAfterStrict(node, declaration);
    node.argumentsId = declaration.declarations[0].id;
  }

  return node.argumentsId;
};
