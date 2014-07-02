'use strict';

import { nodes, lists } from 'nodes';

var List = lists.List;

var listIndex = (node) => {
  var lastNode = node, firstList;
  while (node = node.parentNode) {
    var ancestor = node.parentNode;
    // Function, Program, BlockStatement, SwitchCase
    if (node instanceof List && (ancestor.body === node || ancestor.consequent === node)) {
      firstList = node;
      break;
    // If , forIn / Of
    } else if (ancestor.consequent === node || ancestor.alternate === node || ancestor.body === node) {
      var key = ancestor.indexOf(node);
      ancestor[key] = new nodes.BlockStatement({ body: [ node ] });
    } else {
      lastNode = node;
    }
  }
  if (!firstList) throw new Error('parent list not found');

  return [ firstList, firstList.indexOf(lastNode) ];
};

// insertBefore

export var insertBefore = (node, node2) => {
  var [ list, index ] = listIndex(node);
  list.splice(index, 0, node2);
  return node2;
};

export var insertAfter = (node, node2) => {
  var [ list, index ] = listIndex(node);
  list.splice(index + 1, 0, node2);
  return node2;
};

export var insertAfterStrict = function(parentNode, node) {
  var body = nodes.Function.test(parentNode) ? parentNode.body.body : parentNode.body;
  var firstChild = body[0];
  if (firstChild && firstChild.matches('#ExpressionStatement > expression#Literal[value=use strict] < *')) {
    body.splice(1, 0, node);
  } else {
    body.unshift(node);
  }
  return node;
};
