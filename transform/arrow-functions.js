'use strict';

var { nodes } = require('nodes');
var syntax = require('nodes/syntax.json');

var { getSelfId } = require('../util/self');
var { getArgumentsId } = require('../util/arguments');

function arrowify(program) {

  var q = [
    '#ArrowFunctionExpression => #ThisExpression',
    '#ArrowFunctionExpression => #Identifier:reference[name=arguments]'
  ];

  program.search(q).forEach((expression) => {
    var arrowFunction = expression.scope();
    var arrowScope = arrowFunction.scope('[type!=ArrowFunctionExpression]');

    var id;
    if (expression.type === syntax.ThisExpression) {
      id = getSelfId(arrowScope);
    } else {
      id = getArgumentsId(arrowScope);
    }
    expression.parentNode.replaceChild(expression, id.clone());
  });

  program.search('#ArrowFunctionExpression').forEach((node) => {
    var shallow = new nodes.FunctionExpression(node);
    node.parentNode.replaceChild(node, shallow);
  });
}

exports.transform = arrowify;
