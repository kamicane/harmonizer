'use strict';

import { nodes, syntax } from 'nodes';

import { createUniqueDeclaration } from '../util/id';

export default function arrowify(program) {

  var q = [
    '#ArrowFunctionExpression => #ThisExpression',
    '#ArrowFunctionExpression => #Identifier:reference[name=arguments]'
  ];

  program.search(q).forEach((expression) => {
    var arrowFunction = expression.scope();
    var arrowScope = arrowFunction.scope('[type!=ArrowFunctionExpression]');

    var id;
    if (expression.type === syntax.ThisExpression) {
      id = createUniqueDeclaration(arrowScope, 'self', 'this');
    } else {
      id = createUniqueDeclaration(arrowScope, 'parameters', 'arguments');
    }
    expression.parentNode.replaceChild(expression, id);
  });

  program.search('#ArrowFunctionExpression').forEach((node) => {
    var shallow = new nodes.FunctionExpression(node);
    node.parentNode.replaceChild(node, shallow);
  });
}
