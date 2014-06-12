'use strict';

var esprima = require('esprima');

var build = require('nodes');
var types = require('nodes/types');
var syntax = require('nodes/syntax.json');

var slice = Array.prototype.slice;

// string

var capitalize = function(string) {
  return string.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

var lowerFirst = function(string) {
  return string.replace(/^[A-Z]/, function(a) { return a.toLowerCase(); });
};

// insertBefore

var insertBefore = function(node, node2) {
  var parentNodeInList = node.parent('#Node < #List');
  var parentList = parentNodeInList.parentNode;
  parentList.splice(parentList.indexOf(parentNodeInList), 0, node2);
};

// expression

var express = function(string) {
  return build(esprima.parse(string).body[0]);
};

var getUniqueName = function(node, name) {
  var names = node.search('#Identifier:declaration > name, #Identifier:reference > name');
  while (~names.indexOf(name)) name = '_' + name;
  return name;
};

var getUniqueId = function(node, name) {
  name = getUniqueName(node, name);
  return new types.Identifier({ name: name });
};

// # util definitions

var getSelfId = function(node) {
  if (!node.selfId) {
    var selfName = getUniqueName(node, 'self');
    var declaration = express('var ' + selfName + ' = this');
    var id = declaration.declarations[0].id;
    var body = types.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.selfId = id;
  }

  return node.selfId;
};

var spread = function() {
  var array = [], last = arguments.length - 1;
  for (var i = 0; i < last; i++) array.push(arguments[i]);
  var iterator = arguments[last][Symbol.iterator](), step;
  while (!(step = iterator.next()).done) array.push(step.value);
  return array;
};

var getSpreadId = function(node) {
  if (!node.spreadId) {
    var spreadName = getUniqueName(node, 'spread');
    var declaration = express('var ' + spreadName + ' = ' + spread.toString());
    var id = declaration.declarations[0].id;
    var body = types.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.spreadId = id;
  }

  return node.spreadId;
};

var getSliceId = function(node) {
  if (!node.sliceId) {
    var sliceName = getUniqueName(node, 'slice');
    var declaration = express('var ' + sliceName + ' = Array.prototype.slice');
    var id = declaration.declarations[0].id;
    var body = types.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.sliceId = id;
  }

  return node.sliceId;
};

// # create nodes

var createDeclarator = function(id, init) {
  return new types.VariableDeclarator({
    id: id,
    init: init
  });
};

var createAssignment = function(left, right) {
  return new types.AssignmentExpression({
    operator: '=',
    left: left,
    right: right
  });
};

// # pretty numbers

// var numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

var destruct = {

  ArrayPattern: function(pattern, declarations, valueId, assign) {

    var create = assign ? createAssignment : createDeclarator;

    pattern.elements.forEachRight(function(element, i) {
      if (element == null) return; // empty [,x]

      var memberString = valueId ? valueId.name + '[' + i + ']' : null;

      if (element.type === syntax.Identifier) {
        declarations.unshift(create(element, memberString ? express(memberString).expression : null));
      } else if (element.search('properties > * > value#Identifier, elements > #Identifier').length) {
        var nestedId;

        if (valueId) {
          nestedId = getUniqueId(declarations.scope(), valueId.name + i);
          var declaration = express('var ' + nestedId.name + ' = ' + memberString);
          insertBefore(declarations, declaration);
        }

        destruct[element.type](element, declarations, nestedId, assign);
      }

    });
  },

  ObjectPattern: function(pattern, declarations, valueId, assign) {
    var create = assign ? createAssignment : createDeclarator;

    pattern.properties.forEachRight(function(property) {

      var memberString = valueId ? valueId.name + '.' + property.key.name : null;

      var value = property.value;

      if (value.type === syntax.Identifier) {
        declarations.unshift(create(value, memberString ? express(memberString).expression : null));
      } else if (value.search('properties > * > value#Identifier, elements > #Identifier').length) {

        var nestedId;

        if (valueId) {
          nestedId = getUniqueId(declarations.scope(), valueId.name + capitalize(property.key.name));
          var declaration = express('var ' + nestedId.name + ' = ' + memberString);
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

  // transform forOf, forIn
  // note: esprima has a bug (?) where it only parses declarations as patterns in for*statements
  q = ['#ForOfStatement > left > declarations > * > #ArrayPattern',
      '#ForOfStatement > left > declarations > * > #ObjectPattern',
      '#ForInStatement > left > declarations > * > #ArrayPattern',
      '#ForInStatement > left > declarations > * > #ObjectPattern'];

  program.search(q).forEachRight(function(pattern) {
    var declarator = pattern.parentNode;
    var declarations = declarator.parentNode;
    var declaration = declarations.parentNode;
    var forStatement = declaration.parentNode;

    var valueId = getUniqueId(forStatement.scope(), 'value');

    declarations.replaceChild(declarator, new types.VariableDeclarator({
      id: valueId
    }));

    var newDeclaration = new types.VariableDeclaration;
    forStatement.body.body.unshift(newDeclaration);
    destruct[pattern.type](pattern, newDeclaration.declarations, valueId);
  });

  // transform declarators
  q = '#VariableDeclarator > #ArrayPattern, #VariableDeclarator > #ObjectPattern';

  program.search(q).forEachRight(function(pattern) {

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
        valueId = getUniqueId(declarations.scope(), lowerFirst(pattern.type));
        var valueDeclaration = express('var ' + valueId.name + ' = $');
        valueDeclaration.declarations[0].init = declarator.init;
        insertBefore(declarations, valueDeclaration);
      }

      destruct[pattern.type](pattern, declarations, valueId);
    }

  });

  // transform assignments
  q = '#AssignmentExpression > left#ArrayPattern, #AssignmentExpression > left#ObjectPattern';

  program.search(q).forEachRight(function(pattern) {

    var expression = pattern.parentNode; // AssignmentExpression
    var right = expression.right;

    var expressions = expression.parentNode;
    var sequence = expressions.parentNode;

    // make every assignment with pattern into sequence expressions
    // when not already, ofcourse.
    if (sequence.type !== syntax.SequenceExpression) {
      var key = expressions.indexOf(expression);

      expressions[key] = new types.SequenceExpression({
        expressions: [ expressions[key] ]
      });

      expressions = expressions[key].expressions;
    }

    expressions.removeChild(expression);

    var sequence = expressions.parentNode;

    var valueId;

    if (right.type === syntax.Identifier) {
      valueId = right;
    } else {
      valueId = getUniqueId(sequence.scope(), lowerFirst(pattern.type));
      var declaration = express('var ' + valueId.name + ' = $');
      declaration.declarations[0].init = right;
      insertBefore(sequence, declaration);
    }

    destruct[pattern.type](pattern, expressions, valueId, true);
  });

  // transform function params
  q = '#Function > params > #ArrayPattern, #Function > params > #ObjectPattern';

  program.search(q).forEachRight(function(pattern) {
    var params = pattern.parentNode;
    var fn = params.parentNode;

    var valueId = getUniqueId(fn, lowerFirst(pattern.type));

    params.replaceChild(pattern, valueId);

    if (!pattern.search('properties > * > value#Identifier, elements > #Identifier').length) return;

    var declaration = new types.VariableDeclaration();
    fn.body.body.unshift(declaration);
    destruct[pattern.type](pattern, declaration.declarations, valueId);

  });

}

function defaultify(program) {
  program.search('#Function').forEach(function(fn) {
    if (fn.defaults.length === 0) return;

    var params = fn.params;
    var defaults = fn.defaults;

    defaults.forEachRight(function(node, i) {
      if (node == null) return defaults.removeChild(node);

      var param = params[i];
      var statement = express('if (' + param.name + ' === void 0) ' + param.name + ' = $');
      statement.consequent.expression.right = node;
      fn.body.body.unshift(statement);
    });

  });
}

// add all blocks for maybe future variable declarations
function blockify(program) {

  // todo: SwitchCase ?

  var statementBodies = [
    '#IfStatement > alternate', '#IfStatement > consequent',
    '#ForStatement > body', '#ForInStatement > body', '#ForOfStatement > body',
    '#WhileStatement > body', '#DoWhileStatement > body',
    '#LabeledStatement > body'
  ].map(function(type) {
    return type + '[type!=BlockStatement]';
  });

  program.search(statementBodies).forEach(function(statement) {
    var parentNode = statement.parentNode;
    var key = parentNode.indexOf(statement);
    parentNode[key] = new types.BlockStatement({ body: [ statement ] });
  });

  program.search('#ArrowFunctionExpression[expression=true]').forEach(function(node) {
    node.expression = false;
    node.body = new types.BlockStatement({
      body: [ new types.ReturnStatement({ argument: node.body }) ]
    });
  });

}

// remove property shorthand and method shorthand
function deshorthandify(program) {
  program.search('#Property').forEach(function(node) {
    node.shorthand = false;
    node.method = false;
  });
}


// transform rest param
function restify(program) {

  program.search('#Function[rest!=null]').forEach(function(node) {
    var block = node.body.body;
    var length = node.params.length;

    var sliceId = getSliceId(program);

    var declaration = express(
      'var ' + node.rest.name + ' = ' +
      sliceId.name + '.call(arguments' + (length === 0 ? '' : ', ' + length) + ')'
    );

    node.rest = null;

    block.unshift(declaration);

  });

}

// transform arrow functions
function arrowify(program) {

  program.search('#ArrowFunctionExpression #ThisExpression').forEach(function(thisExpression) {
    var arrowFunction, selfScope = thisExpression;

    while (selfScope = selfScope.scope()) {
      if (selfScope.type === syntax.ArrowFunctionExpression) arrowFunction = selfScope;
      else break;
    }

    if (!arrowFunction) return;

    var selfId = getSelfId(arrowFunction.scope());

    thisExpression.parentNode.replaceChild(thisExpression, selfId.clone());
  });

  program.search('#ArrowFunctionExpression').forEach(function(node) {
    var shallow = new types.FunctionExpression(node);
    node.parentNode.replaceChild(node, shallow);
  });
}

function forofify(program) {

  program.search('#ForOfStatement').forEach(function(node) {

    var forStatement = new types.ForStatement;

    var declaratorId = node.left.declarations[0].id;

    var iteratorId = getUniqueId(node.scope(), 'iterator');
    var stepId = getUniqueId(node.scope(), 'step');

    forStatement.body = node.body;

    var init = new types.CallExpression({
      callee: new types.MemberExpression({
        computed: true,
        object: node.right,
        property: new types.MemberExpression({
          computer: false,
          object: new types.Identifier({ name: 'Symbol' }),
          property: new types.Identifier({ name: 'iterator' })
        })
      })
    });

    forStatement.init = new types.VariableDeclaration({
      declarations: [
        new types.VariableDeclarator({
          id: iteratorId,
          init: init
        }),
        new types.VariableDeclarator({
          id: stepId
        })
       ]
    });

    forStatement.test = express('!(' + stepId.name + ' = ' + iteratorId.name + '.next()).done').expression;
    var declaration = express('var ' + declaratorId.name + ' = ' + stepId.name + '.value');
    forStatement.body.body.unshift(declaration);

    node.parentNode.replaceChild(node, forStatement);

  });
}

// note: esprima has a bug (?) where the spread element is only accepted as the last argument / element
// I chose not to implement spread the "right" way until esprima gets fixed.
function spreadify(program) {

  program.search('#SpreadElement < arguments < #CallExpression').forEach(function(node) {

    var args = node.arguments;
    var spread = args[args.length - 1];

    args.replaceChild(spread, spread.argument);

    var spreadId = getSpreadId(program);

    var spreadCall = express(spreadId.name + '()').expression;

    spreadCall.arguments.push.apply(spreadCall.arguments, args);

    args.push(spreadCall);

    var callee = node.callee;
    var object = callee.object;

    if (callee.type !== syntax.MemberExpression) {

      args.unshift(new types.Literal({ value: null }));

    } else {

      if (object.type !== syntax.Identifier) {
        var contextId = getUniqueId(node.scope(), lowerFirst(object.type));
        var declaration = express('var ' + contextId.name + ' = $');
        var declarator = declaration.declarations[0];
        declarator.init = object.clone();
        insertBefore(node, declaration);

        object = callee.object = contextId;
      }

      args.unshift(object.clone());
    }

    node.callee = new types.MemberExpression({
      object: node.callee,
      property: new types.Identifier({ name: 'apply' })
    });

  });

  program.search('#SpreadElement < elements < #ArrayExpression').forEach(function(node) {

    var elements = node.elements;
    var spread = elements[elements.length - 1];

    elements.replaceChild(spread, spread.argument);

    var spreadId = getSpreadId(program);

    var spreadCall = express(spreadId.name + '()').expression;

    spreadCall.arguments.push.apply(spreadCall.arguments, elements);

    node.parentNode.replaceChild(node, spreadCall);

  });

}

// todo: process params as one to keep declaration order, in case of duplicate param names.
// todo: do not lose loc on replaceChild.

function transform(tree) {
  var program = build(tree);

  window.program = program;

  // return program;

  blockify(program); // blockify the program
  deshorthandify(program); // remove shorthand properties
  arrowify(program); // transform arrow functions
  restify(program); // transform rest parameter

  defaultify(program); // transform default parameters
  patternify(program); // transform patterns
  forofify(program); // transform for of
  spreadify(program); // transform spread
  // comprehendify(program); // transform comprehensions
  // classify(program); // transform classes
  // letify(program); // transform let

  return program;
}

module.exports = transform;
