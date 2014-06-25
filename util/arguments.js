'use strict';

import { getUniqueName } from './id';
import { express } from './string';
import { insertAfterStrict } from './insertion';

export var getArgumentsId = (node) => {
  if (!node.argumentsId) {
    var argumentsName = getUniqueName(node, '_arguments');
    var declaration = express(`var ${argumentsName} = arguments`);
    insertAfterStrict(node, declaration);
    node.argumentsId = declaration.declarations[0].id;
  }

  return node.argumentsId;
};
