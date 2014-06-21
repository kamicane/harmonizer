'use strict';

var { getUniqueName } = require('./id');
var { express } = require('./string');
var { insertAfterStrict } = require('./insertion');

exports.getSelfId = (node) => {
  if (!node.selfId) {
    var selfName = getUniqueName(node, 'self');
    var declaration = express(`var ${selfName} = this`);
    insertAfterStrict(node, declaration);
    node.selfId = declaration.declarations[0].id;
  }

  return node.selfId;
};
