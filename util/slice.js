'use strict';

var { nodes } = require('nodes');

var { getUniqueName } = require('./id');
var { express } = require('./string');

exports.getSliceId = (node) => {
  if (!node.sliceId) {
    var sliceName = getUniqueName(node, 'slice');
    var declaration = express(`var ${sliceName} = Array.prototype.slice`);
    var id = declaration.declarations[0].id;
    var body = nodes.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.sliceId = id;
  }

  return node.sliceId;
};
