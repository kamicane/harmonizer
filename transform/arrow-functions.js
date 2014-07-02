'use strict';

import { nodes, syntax } from 'nodes';

import { createUniqueDeclaration } from '../util/id';

export default function arrowify(program) {

  var arrowFunctions = program.search('#ArrowFunctionExpression');

  arrowFunctions.forEach((node) => {

    if (node.expression) {
      node.expression = false;
      node.body = new nodes.BlockStatement({
        body: [ new nodes.ReturnStatement({ argument: node.body }) ]
      });
    }

    var arrowScope = node.scope('[type!=ArrowFunctionExpression]');

    node.search('=> #ThisExpression, => #Identifier:reference[name=arguments]').forEach((expression) => {
      var id;
      if (expression.type === syntax.ThisExpression) {
        id = createUniqueDeclaration(arrowScope, 'self', 'this');
      } else {
        id = createUniqueDeclaration(arrowScope, 'parameters', 'arguments');
      }
      expression.parentNode.replaceChild(expression, id);
    });

  });

  arrowFunctions.forEach(function(node) {
    var shallow = new nodes.FunctionExpression(node);
    node.parentNode.replaceChild(node, shallow);
  });
}
