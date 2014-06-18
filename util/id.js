'use strict';

var { nodes } = require('nodes');

var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

var letter = (i) => {
  if (i <= 25) return letters[i];
  return letter(Math.floor(i / 26) - 1) + letters[i % 26];
};

exports.getUniqueName = (node, name) => {
  var names = node.search('#Identifier:declaration > name, #Identifier:reference > name');
  var preferred = name, i = 0;
  while (~names.indexOf(name)) name = `${preferred}${letter(i++)}`;
  return name;
};

exports.getUniqueId = (node, name) => {
  name = exports.getUniqueName(node, name);
  return new nodes.Identifier({ name });
};
