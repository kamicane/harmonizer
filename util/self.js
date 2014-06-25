'use strict';

import { getUniqueName } from './id';
import { express } from './string';
import { insertAfterStrict } from './insertion';

export var getSelfId = (node) => {
  if (!node.selfId) {
    var selfName = getUniqueName(node, 'self');
    var declaration = express(`var ${selfName} = this`);
    insertAfterStrict(node, declaration);
    node.selfId = declaration.declarations[0].id;
  }

  return node.selfId;
};
