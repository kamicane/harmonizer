'use strict';

var { nodes } = require('nodes');
var syntax = require('nodes/syntax.json');

var { express, lower, upper } = require('../util/string');
var { insertBefore } = require('../util/insertion');
var { getUniqueId } = require('../util/id');

var createDeclarator = (id, init) => new nodes.VariableDeclarator({ id, init });
var createAssignment = (left, right) => new nodes.AssignmentExpression({ operator: '=', left, right });

var destruct = {

  ArrayPattern(pattern, declarations, valueId, assign) {

    var create = assign ? createAssignment : createDeclarator;

    pattern.elements.forEachRight(function(element, i) {
      if (element == null) return; // empty [,x]

      var memberString = valueId ? `${valueId.name}[${i}]` : null;

      if (element.type === syntax.Identifier) {
        declarations.unshift(create(element, memberString ? express(memberString).expression : null));
      } else if (element.search('properties > * > value#Identifier, elements > #Identifier').length) {
        var nestedId;

        if (valueId) {
          nestedId = getUniqueId(declarations.scope(), valueId.name + i);
          var declaration = express(`var ${nestedId.name} = ${memberString}`);
          insertBefore(declarations, declaration);
        }

        destruct[element.type](element, declarations, nestedId, assign);
      }

    });
  },

  ObjectPattern(pattern, declarations, valueId, assign) {

    var create = assign ? createAssignment : createDeclarator;

    pattern.properties.forEachRight((property) => {

      var memberString = valueId ? `${valueId.name}.${property.key.name}` : null;

      var value = property.value;

      if (value.type === syntax.Identifier) {
        declarations.unshift(create(value, memberString ? express(memberString).expression : null));
      } else if (value.search('properties > * > value#Identifier, elements > #Identifier').length) {

        var nestedId;

        if (valueId) {
          nestedId = getUniqueId(declarations.scope(), valueId.name + upper(property.key.name));
          var declaration = express(`var ${nestedId.name} = ${memberString}`);
          insertBefore(declarations, declaration);
        }

        destruct[value.type](value, declarations, nestedId, assign);
      }

    });
  }

};

// transform patterns
function patternify(program) {

  var q;

  // transform forOf, forIn declaration pattern
  // this is covered by forofify,
  // since it transform for of statements into for statements.
  q = ['#ForOfStatement > left > declarations > * > #ArrayPattern',
      '#ForOfStatement > left > declarations > * > #ObjectPattern',
      '#ForInStatement > left > declarations > * > #ArrayPattern',
      '#ForInStatement > left > declarations > * > #ObjectPattern'];

  program.search(q).forEachRight((pattern) => {
    var declarator = pattern.parentNode;
    var declarations = declarator.parentNode;
    var declaration = declarations.parentNode;
    var forStatement = declaration.parentNode;

    var valueId = getUniqueId(forStatement.scope(), lower(pattern.type));

    declarations.replaceChild(declarator, new nodes.VariableDeclarator({
      id: valueId,
      kind: declaration.kind
    }));

    var newDeclaration = new nodes.VariableDeclaration;
    forStatement.body.body.unshift(newDeclaration);
    destruct[pattern.type](pattern, newDeclaration.declarations, valueId);
  });

  // transform forOf, forIn assignment patterns
  // this is covered by forofify,
  // since it transform for of statements into for statements.
  q = ['#ForOfStatement > left#ArrayPattern',
      '#ForOfStatement > left#ObjectPattern',
      '#ForInStatement > left#ArrayPattern',
      '#ForInStatement > left#ObjectPattern'];

  program.search(q).forEachRight(function(pattern) {
    var forStatement = pattern.parentNode;

    var valueId = getUniqueId(forStatement.scope(), lower(pattern.type));

    forStatement.left = express(`var ${valueId.name}`);

    var expression = new nodes.ExpressionStatement;
    var sequence = new nodes.SequenceExpression;
    expression.expression = sequence;
    forStatement.body.body.unshift(expression);
    destruct[pattern.type](pattern, sequence.expressions, valueId, true);
  });

  // transform declarators
  q = '#VariableDeclarator > #ArrayPattern, #VariableDeclarator > #ObjectPattern';

  program.search(q).forEachRight((pattern) => {

    var declarator = pattern.parentNode;
    var declarations = declarator.parentNode;
    var declaration = declarations.parentNode;

    declarations.removeChild(declarator);

    if (!pattern.search('properties > * > value#Identifier, elements > #Identifier').length) { // empty declaration
      if (!declarations.length) {
        declaration.parentNode.removeChild(declaration);
      }
      return;
    }

    if (declarator.init == null) {
      destruct[pattern.type](pattern, declarations);
    } else {
      var valueId;
      if (declarator.init.type === syntax.Identifier) {
        valueId = declarator.init;
      } else {

        valueId = getUniqueId(declarations.scope(), lower(pattern.type));
        var valueDeclaration = express(`var ${valueId.name} = $`);
        valueDeclaration.declarations[0].init = declarator.init;
        insertBefore(declarations, valueDeclaration);

      }

      destruct[pattern.type](pattern, declarations, valueId);
    }

  });

  // transform assignments
  q = '#AssignmentExpression > left#ArrayPattern, #AssignmentExpression > left#ObjectPattern';

  program.search(q).forEachRight((pattern) => {

    var expression = pattern.parentNode; // AssignmentExpression
    var right = expression.right;

    var expressions = expression.parentNode;
    var sequence = expressions.parentNode;

    // make every assignment with pattern into sequence expressions
    // when not already, ofcourse.
    if (sequence.type !== syntax.SequenceExpression) {
      var key = expressions.indexOf(expression);

      expressions[key] = new nodes.SequenceExpression({
        expressions: [ expressions[key] ]
      });

      expressions = expressions[key].expressions;
    }

    expressions.removeChild(expression);

    sequence = expressions.parentNode;

    var valueId;

    if (right.type === syntax.Identifier) {
      valueId = right;
    } else {
      valueId = getUniqueId(sequence.scope(), lower(pattern.type));
      var declaration = express(`var ${valueId.name} = $`);
      declaration.declarations[0].init = right;
      insertBefore(sequence, declaration);
    }

    destruct[pattern.type](pattern, expressions, valueId, true);
  });

  // transform function params
  q = '#Function > params > #ArrayPattern, #Function > params > #ObjectPattern';

  program.search(q).forEachRight((pattern) => {
    var params = pattern.parentNode;
    var fn = params.parentNode;

    var valueId = getUniqueId(fn, lower(pattern.type));
    params.replaceChild(pattern, valueId);

    if (!pattern.search('properties > * > value#Identifier, elements > #Identifier').length) return;

    var declaration = new nodes.VariableDeclaration;
    fn.body.body.unshift(declaration);
    destruct[pattern.type](pattern, declaration.declarations, valueId);

  });

}

exports.transform = patternify;
