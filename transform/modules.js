'use strict';

import { nodes, syntax } from 'nodes';

import { express } from '../util/string';
import { insertBefore } from '../util/insertion';
import patternify from './patterns';

export default function modulize(program) {

  program.search('#ExportDeclaration').forEach(function(node) {

    var statement, sequence;

    // easy peasy, just replace it with exports.default;
    // declaration in this case is an expression.

    if (node.default) {

      statement = express('exports.default = $');
      statement.expression.right = node.declaration;

    // if it is a variabledeclaration, replace it with exports.X for each declarator
    } else if (node.declaration) {

      var declaration = node.declaration;

      insertBefore(node, declaration);

      var declarationType = declaration.type;

      if (declarationType === syntax.VariableDeclaration) {

        statement = new nodes.ExpressionStatement;
        sequence = new nodes.SequenceExpression;
        statement.expression = sequence;

        declaration.declarations.forEach(function(declarator) {
          var assignment = express(`exports.${declarator.id.name} = ${declarator.id.name}`).expression;
          sequence.expressions.push(assignment);
        });


      } else if (declarationType === syntax.FunctionDeclaration || declarationType === syntax.ClassDeclaration) {

        var name = declaration.id.name;
        statement = express(`exports.${name} = ${name}`);
      }

    // has specifiers
    } else {
      var specifiers = node.specifiers;

      statement = new nodes.ExpressionStatement;
      sequence = new nodes.SequenceExpression;
      statement.expression = sequence;

      specifiers.forEach(function(specifier) {
        var specifierId = specifier.id;
        var specifierName = specifier.name || specifierId;
        var assignment = express(`exports.${specifierName.name} = ${specifierId.name}`).expression;
        sequence.expressions.push(assignment);
      });

    }

    node.parentNode.replaceChild(node, statement);

  });

  program.search('#ImportDeclaration').forEach(function(node) {
    if (!node.specifiers.length) { // bare import

      var requireExpression = express(`require()`);
      requireExpression.expression.arguments.push(node.source);
      node.parentNode.replaceChild(node, requireExpression);

    } else if (node.kind === 'default') {

      var specifierName = node.specifiers[0].id.name;
      var requireDeclaration = express(`var ${specifierName} = require().default`);
      requireDeclaration.declarations[0].init.object.arguments.push(node.source);
      node.parentNode.replaceChild(node, requireDeclaration);

    } else { // let patternify transform this for us

      var patternDeclaration = express(`var {} = require()`);
      var declarator = patternDeclaration.declarations[0];
      var pattern = declarator.id;
      declarator.init.arguments.push(node.source);

      node.specifiers.forEach(function(specifier) {
        var specifierId = specifier.id;
        var specifierName = specifier.name;

        pattern.properties.push(new nodes.Property({
          key: specifierId,
          value: specifierName || specifierId.clone()
        }));

      });

      node.parentNode.replaceChild(node, patternDeclaration);

      patternify(patternDeclaration);
    }

  });

  program.search('#ModuleDeclaration').forEach(function(node) {
    var requireDeclaration = express(`var ${node.id.name} = require()`);
    requireDeclaration.declarations[0].init.arguments.push(node.source);

    node.parentNode.replaceChild(node, requireDeclaration);
  });

}
