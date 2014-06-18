'use strict';

var { nodes } = require('nodes');
var { getSelfId } = require('../util/self');

function arrowify(program) {

  program.search('#ArrowFunctionExpression => #ThisExpression').forEach((thisExpression) => {
    var arrowFunction = thisExpression.scope();
    var arrowScope = arrowFunction.scope('[type!=ArrowFunctionExpression]');
    var selfId = getSelfId(arrowScope).clone();
    thisExpression.parentNode.replaceChild(thisExpression, selfId.clone());
  });

  program.search('#ArrowFunctionExpression').forEach((node) => {
    var shallow = new nodes.FunctionExpression(node);
    node.parentNode.replaceChild(node, shallow);
  });
}

exports.transform = arrowify;
