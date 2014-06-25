'use strict';

import { nodes } from 'nodes';

var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

var letter = (i) => {
  if (i <= 25) return letters[i];
  return letter(Math.floor(i / 26) - 1) + letters[i % 26];
};

export var getUniqueName = (node, name) => {
  var names = node.search('#Identifier:declaration > name, #Identifier:reference > name');
  var preferred = name, i = 0;
  while (~names.indexOf(name)) name = `${preferred}${letter(i++)}`;
  return name;
};

export var getUniqueId = (node, name) => {
  name = getUniqueName(node, name);
  return new nodes.Identifier({ name });
};
