'use strict';

import { getUniqueName } from './id';
import { express } from './string';
import { insertAfterStrict } from './insertion';

export var getSliceId = (node) => {
  if (!node.sliceId) {
    var sliceName = getUniqueName(node, 'slice');
    var declaration = express(`var ${sliceName} = Array.prototype.slice`);
    insertAfterStrict(node, declaration);
    node.sliceId = declaration.declarations[0].id;
  }

  return node.sliceId;
};
