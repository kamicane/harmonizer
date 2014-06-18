'use strict';

var { lists: { List } } = require('nodes');

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
};

exports.insertAfter = (node, node2) => {
  var li = listIndex(node);
  li.list.splice(li.index + 1, 0, node2);
};
