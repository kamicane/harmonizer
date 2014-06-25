'use strict';

import { nodes } from 'nodes';

import { getSelfId } from '../util/self';
import { express } from '../util/string';
import { getUniqueName } from '../util/id';

export default function comprehendify(program) {

  program.search('#ComprehensionExpression').forEach((node) => {
    var parentNode = node.parentNode;
    var blocks = node.blocks;

    var wrapper = express('(function(){})()').expression;
    var body = wrapper.callee.body.body;

    var comprehensionId = new nodes.Identifier({ name: '$' });

    var identifiers = [comprehensionId];

    var comprehensionDeclaration = new nodes.VariableDeclaration({
      declarations: [new nodes.VariableDeclarator({
        id: comprehensionId,
        init: new nodes.ArrayExpression
      })]
    });

    var forOfRoot, forOfInnermost;

    blocks.forEach((block) => {
      var forOfStatement = new nodes.ForOfStatement;

      forOfStatement.left = new nodes.VariableDeclaration({
        declarations: [ new nodes.VariableDeclarator({id: block.left}) ]
      });

      forOfStatement.right = block.right;
      forOfStatement.body = new nodes.BlockStatement;

      if (forOfInnermost) forOfInnermost.body.body.push(forOfStatement);
      else forOfRoot = forOfStatement;

      forOfInnermost = forOfStatement;
    });

    var pushCallExpression = express(`${comprehensionId.name}.push()`);
    pushCallExpression.expression.arguments.push(node.body);
    identifiers.push(pushCallExpression.expression.callee.object);

    if (node.filter) {
      var ifStatement = new nodes.IfStatement({
        test: node.filter,
        consequent: pushCallExpression
      });
      forOfInnermost.body.body.push(ifStatement);
    } else {
      forOfInnermost.body.body.push(pushCallExpression);
    }

    var returnStatement = new nodes.ReturnStatement({
      argument: comprehensionId.clone()
    });

    identifiers.push(returnStatement.argument);

    body.push(comprehensionDeclaration, forOfRoot, returnStatement);
    parentNode.replaceChild(node, wrapper);

    var comprehensionName = getUniqueName(wrapper.callee, 'comprehension');

    identifiers.forEach((id) => {
      id.name = comprehensionName;
    });

    body.search('=> #ThisExpression').forEach(function(node) {
      var selfId = getSelfId(wrapper.scope());
      node.parentNode.replaceChild(node, selfId.clone());
    });

  });

}
