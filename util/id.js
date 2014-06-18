'use strict';

var { nodes } = require('nodes');

var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

var letter = function(i) {
  if (i <= 25) return letters[i];
  var loops = -1;
  while (i > 25) {
    loops++;
    i -= 26;
  }
  return letter(loops) + letters[i];
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
