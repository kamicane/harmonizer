'use strict';

var { nodes } = require('nodes');
var syntax = require('nodes/syntax.json');

var { getUniqueId } = require('../util/id');
var { express } = require('../util/string');

function forofify(program) {

  program.search('#ForOfStatement').forEach((node) => {

    var forStatement = new nodes.ForStatement;

    var left = node.left;

    var iteratorId = getUniqueId(node.scope(), 'iterator');
    var stepId = getUniqueId(node.scope(), 'step');

    forStatement.body = node.body;

    var init = new nodes.CallExpression({
      callee: new nodes.MemberExpression({
        computed: true,
        object: node.right,
        property: new nodes.Literal({ value: '@@iterator' })
      })
    });

    forStatement.init = new nodes.VariableDeclaration({
      declarations: [
        new nodes.VariableDeclarator({
          id: iteratorId,
          init: init
        }),
        new nodes.VariableDeclarator({
          id: stepId
        })
       ]
    });

    forStatement.test = express(`!(${stepId.name} = ${iteratorId.name}.next()).done`).expression;

    var expression, xp = express(`${stepId.name}.value`).expression;

    if (left.type === syntax.VariableDeclaration) {
      left.declarations[0].init = xp;
      expression = left;
    } else {
      expression = new nodes.ExpressionStatement({
        expression: new nodes.AssignmentExpression({
          operator: '=',
          left: left,
          right: xp
        })
      });
    }

    forStatement.body.body.unshift(expression);

    node.parentNode.replaceChild(node, forStatement);

  });
}

exports.transform = forofify;
