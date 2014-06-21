'use strict';

var { nodes, lists: { List } } = require('nodes');

var listIndex = (node) => {
  var lastNode = node, firstList;
  while (node = node.parentNode) {
    if (node instanceof List) {
      firstList = node;
      break;
    } else {
      lastNode = node;
    }
  }
  if (!firstList) throw new Error('parent list not found');

  return { list: firstList, index: firstList.indexOf(lastNode) };
};

// insertBefore

exports.insertBefore = (node, node2) => {
  var li = listIndex(node);
  li.list.splice(li.index, 0, node2);
  return node2;
};

exports.insertAfter = (node, node2) => {
  var li = listIndex(node);
  li.list.splice(li.index + 1, 0, node2);
  return node2;
};

exports.insertAfterStrict = function(parentNode, node) {
  var body = nodes.Function.test(parentNode) ? parentNode.body.body : parentNode.body;
  var firstChild = body[0];
  if (firstChild && firstChild.matches('#ExpressionStatement > expression#Literal[value=use strict] < *')) {
    body.splice(1, 0, node);
  } else {
    body.unshift(node);
  }
  return node;
};
