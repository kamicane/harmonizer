'use strict';

var syntax = require('nodes/syntax.json');

var { getUniqueName } = require('../util/id');

var isFor = (node) => {
  var type;
  return node && (type = node.type) && (
    type === syntax.ForStatement ||
    type === syntax.ForInStatement ||
    type === syntax.ForOfStatement
  );
};

var lookupReferenceLetDeclarators = (node) => {
  var name = node.name;
  var identifiers;

  var dec = `#VariableDeclaration[kind=let] #Identifier:declaration[name=${name}]`;

  while (node = node.parentNode) {
    if (isFor(node) || node.type === syntax.BlockStatement || node.type === syntax.Program) {
      identifiers = node.search(`~> ${dec}`);
      if (identifiers.length) {
        var ancestor = node.parentNode;
        if (isFor(ancestor)) node = ancestor;
        return [node, identifiers];
      }
    }

  }
};

function letify(program) {

  var lets = program.search('#VariableDeclaration[kind=let]');

  if (!lets.length) return;

  var uniqueNameMap = {};

  // find referenced lets, rename declaration and reference
  program.search(':reference').forEach((ref) => {
    var result = lookupReferenceLetDeclarators(ref);
    if (!result) return;

    var [block, identifiers] = result;

    var map = uniqueNameMap[block.uid] || (uniqueNameMap[block.uid] = {});

    var scope = block === program ? block : block.scope();

    var name = ref.name;

    identifiers.forEach((dec) => {

      var uniqueName = map[name] || (map[name] = getUniqueName(scope, name));
      dec.var_name = uniqueName; // save its var_name

    });

    ref.name = map[name];
  });

  lets.forEach((node) => {
    node.kind = 'var';
  });

  lets.search('#Identifier:declaration').forEach((node) => {
    if (node.var_name) {
      node.name = node.var_name;
      delete node.var_name;
    } else {
      var uniqueName = getUniqueName(node.scope(), node.name);
      node.name = uniqueName;
    }
  });
}

exports.transform = letify;
