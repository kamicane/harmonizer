'use strict';

import { nodes } from 'nodes';
import { express } from './string';
import { insertAfterStrict } from './insertion';

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

export var createUniqueDeclaration = (node, name, expression) => {
  var id = '@@' + name;

  if (!node[id]) {
    var uniqueName = getUniqueName(node, name);
    var declaration = express(`var ${uniqueName} = ${expression}`);
    insertAfterStrict(node, declaration);
    node[id] = declaration.declarations[0].id;
  }
  return node[id].clone();
};
