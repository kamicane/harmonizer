'use strict';

var { getUniqueName } = require('./id');
var { express } = require('./string');
var { insertAfterStrict } = require('./insertion');

exports.getSliceId = (node) => {
  if (!node.sliceId) {
    var sliceName = getUniqueName(node, 'slice');
    var declaration = express(`var ${sliceName} = Array.prototype.slice`);
    insertAfterStrict(node, declaration);
    node.sliceId = declaration.declarations[0].id;
  }

  return node.sliceId;
};
