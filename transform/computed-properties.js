'use strict';

import { getUniqueName, createUniqueDeclaration } from '../util/id';
import { insertBefore, insertAfter } from '../util/insertion';
import { express } from '../util/string';

export default function computify(program) {

  var getDPName = function() {
    return createUniqueDeclaration(program, 'defineProperty', 'Object.defineProperty').name;
  };

  program.search('#Property[computed=true] < * < *').forEach(function(node) {
    var scope = node.scope();

    var parentNode = node.parentNode;
    var objectName = getUniqueName(scope, 'objectExpression');
    var declaration = express(`var ${objectName}`);
    insertBefore(node, declaration);
    parentNode.replaceChild(node, declaration.declarations[0].id.clone());
    declaration.declarations[0].init = node;

    node.properties.forEachRight(function(property, i) {
      if (property.computed) {
        if (property.kind === 'init') {
          var assignmentExpression = express(`${objectName}[$] = $`);
          assignmentExpression.expression.left.property = property.key;
          assignmentExpression.expression.right = property.value;
          insertAfter(declaration, assignmentExpression);
        } else {
          var definitionExpression = express(`${getDPName()}(${objectName}, $, {
            ${property.kind}: $,
            configurable: true,
            enumerable: true
          })`);
          var args = definitionExpression.expression.arguments;
          args.splice(1, 1, property.key);
          args[2].properties[0].value = property.value;
          insertAfter(declaration, definitionExpression);
        }
        node.properties.splice(i, 1);
      }
    });
  });

}
