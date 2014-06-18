'use strict';

var { nodes } = require('nodes');

var { getUniqueName } = require('./id');
var { express } = require('./string');

exports.getSelfId = (node) => {
  if (!node.selfId) {
    var selfName = getUniqueName(node, 'self');
    var declaration = express(`var ${selfName} = this`);
    var id = declaration.declarations[0].id;
    var body = nodes.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.selfId = id;
  }

  return node.selfId;
};
