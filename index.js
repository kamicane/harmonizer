'use strict';

var esprima = require('esprima');

var build = require('nodes');
var syntax = require('nodes/syntax.json');

var nodes = build.nodes;
var List = build.lists.List;

// string

var capitalize = function(string) {
  return string.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

var lowerFirst = function(string) {
  return string.replace(/^[A-Z]/, function(a) { return a.toLowerCase(); });
};

var listIndex = function(node) {
  var lastNode = node, firstList;
  while (node = node.parentNode) {
    if (node instanceof List) {
      firstList = node;
      break;
    } else {
      lastNode = node;
    }
  }
  if (!firstList) throw new Error('parent list not found');

  return { list: firstList, index: firstList.indexOf(lastNode) };
};

// insertBefore

var insertBefore = function(node, node2) {
  var li = listIndex(node);
  li.list.splice(li.index, 0, node2);
};

var insertAfter = function(node, node2) {
  var li = listIndex(node);
  li.list.splice(li.index + 1, 0, node2);
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
  return new nodes.Identifier({ name: name });
};

// # util definitions

var getSelfId = function(node) {
  if (!node.selfId) {
    var selfName = getUniqueName(node, 'self');
    var declaration = express('var ' + selfName + ' = this');
    var id = declaration.declarations[0].id;
    var body = nodes.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.selfId = id;
  }

  return node.selfId.clone();
};

var spread = function() {
  var array = [], last = arguments.length - 1;
  for (var i = 0; i < last; i++) array.push(arguments[i]);
  var iterator = arguments[last][Symbol.iterator](), step;
  while (!(step = iterator.next()).done) array.push(step.value);
  return array;
};

var extend = function(SuperClass, Class, prototype, members) {
  var descriptors = function(base, object) {
    for (var key in object) base[key] = Object.getOwnPropertyDescriptor(object, key);
    return base;
  };
  Object.defineProperty(Class, 'prototype', {
    value: Object.create(SuperClass.prototype, descriptors({ value: Class }, prototype))
  });
  return Object.defineProperties(Class, descriptors({}, members));
};

var getSuperDescriptor = function(prototype, name) {
  var descriptor;
  while (prototype = Object.getPrototypeOf(prototype)) {
    if (descriptor = Object.getOwnPropertyDescriptor(prototype, name)) return descriptor;
  }
};

var getExtendId = function(node) {
  if (!node.extendId) {
    var extendName = getUniqueName(node, 'extend');
    var declaration = express('var ' + extendName + ' = ' + extend.toString());
    var id = declaration.declarations[0].id;
    var body = nodes.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.extendId = id;
  }

  return node.extendId;
};

var getSpreadId = function(node) {
  if (!node.spreadId) {
    var spreadName = getUniqueName(node, 'spread');
    var declaration = express('var ' + spreadName + ' = ' + spread.toString());
    var id = declaration.declarations[0].id;
    var body = nodes.Function.test(node) ? node.body.body : node.body;
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
    var body = nodes.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.sliceId = id;
  }

  return node.sliceId;
};

// # create nodes

var createDeclarator = function(id, init) {
  return new nodes.VariableDeclarator({
    id: id,
    init: init
  });
};

var createAssignment = function(left, right) {
  return new nodes.AssignmentExpression({
    operator: '=',
    left: left,
    right: right
  });
};

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

  // transform forOf, forIn declaration pattern
  q = ['#ForOfStatement > left > declarations > * > #ArrayPattern',
      '#ForOfStatement > left > declarations > * > #ObjectPattern',
      '#ForInStatement > left > declarations > * > #ArrayPattern',
      '#ForInStatement > left > declarations > * > #ObjectPattern'];

  program.search(q).forEachRight(function(pattern) {
    var declarator = pattern.parentNode;
    var declarations = declarator.parentNode;
    var declaration = declarations.parentNode;
    var forStatement = declaration.parentNode;

    var valueId = getUniqueId(forStatement.scope(), lowerFirst(pattern.type));

    declarations.replaceChild(declarator, new nodes.VariableDeclarator({
      id: valueId,
      kind: declaration.kind
    }));

    var newDeclaration = new nodes.VariableDeclaration;
    forStatement.body.body.unshift(newDeclaration);
    destruct[pattern.type](pattern, newDeclaration.declarations, valueId);
  });

  // transform forOf, forIn assignment patterns

  q = ['#ForOfStatement > left#ArrayPattern',
      '#ForOfStatement > left#ObjectPattern',
      '#ForInStatement > left#ArrayPattern',
      '#ForInStatement > left#ObjectPattern'];

  program.search(q).forEachRight(function(pattern) {
    var forStatement = pattern.parentNode;

    var valueId = getUniqueId(forStatement.scope(), lowerFirst(pattern.type));

    forStatement.left = express('var ' + valueId.name);

    var expression = new nodes.ExpressionStatement;
    var sequence = new nodes.SequenceExpression;
    expression.expression = sequence;
    forStatement.body.body.unshift(expression);
    destruct[pattern.type](pattern, sequence.expressions, valueId, true);
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

    var declaration = new nodes.VariableDeclaration;
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

    var sliceId = getSliceId(program).clone();

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

  program.search('#ArrowFunctionExpression => #ThisExpression').forEach(function(thisExpression) {
    var arrowFunction = thisExpression.scope();
    var arrowScope = arrowFunction.scope('[type!=ArrowFunctionExpression]');
    var selfId = getSelfId(arrowScope);
    thisExpression.parentNode.replaceChild(thisExpression, selfId.clone());
  });

  program.search('#ArrowFunctionExpression').forEach(function(node) {
    var shallow = new nodes.FunctionExpression(node);
    node.parentNode.replaceChild(node, shallow);
  });
}

function forofify(program) {

  program.search('#ForOfStatement').forEach(function(node) {

    var forStatement = new nodes.ForStatement;

    var left = node.left;

    var iteratorId = getUniqueId(node.scope(), 'iterator');
    var stepId = getUniqueId(node.scope(), 'step');

    forStatement.body = node.body;

    var init = new nodes.CallExpression({
      callee: new nodes.MemberExpression({
        computed: true,
        object: node.right,
        property: express('Symbol.iterator').expression
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

    forStatement.test = express('!(' + stepId.name + ' = ' + iteratorId.name + '.next()).done').expression;

    var expression, xp = express(stepId.name + '.value').expression;

    if (left.type === syntax.VariableDeclaration) {
      left.declarations[0].init = xp;
      expression = left;
    } else {
      expression = new nodes.AssignmentExpression({
        operator: '=',
        left: left,
        right: xp
      });
    }

    forStatement.body.body.unshift(expression);

    node.parentNode.replaceChild(node, forStatement);

  });
}

var applyContext = function(node, context) {
  var args = node.arguments;
  var spread = args[args.length - 1];

  var propertyName;

  if (spread && spread.type === syntax.SpreadElement) {
    args.replaceChild(spread, spread.argument);

    var spreadId = getSpreadId(node.root).clone();

    var spreadCall = express(spreadId.name + '()').expression;

    spreadCall.arguments.push.apply(spreadCall.arguments, args);

    args.push(spreadCall);

    propertyName = 'apply';
  } else {
    propertyName = 'call';
  }

  var callee = node.callee;
  var object = callee.object;

  if (!context) {
    if (callee.type !== syntax.MemberExpression) {

      args.unshift(new nodes.Literal({ value: null }));

    } else {

      if (object.type !== syntax.Identifier) {
        var contextId = getUniqueId(node.scope(), lowerFirst(object.type));
        var declaration = express('var ' + contextId.name + ' = $');
        var declarator = declaration.declarations[0];
        declarator.init = object;
        insertBefore(node, declaration);
        object = callee.object = contextId;
      }

      args.unshift(object.clone());
    }
  } else {
    args.unshift(context);
  }

  node.callee = new nodes.MemberExpression({
    object: node.callee,
    property: new nodes.Identifier({ name: propertyName })
  });
};

// esprima bug: the spread element is only accepted as the last argument / element
// I chose not to implement spread the "right" way until esprima gets fixed, since there is no js parser for it.
function spreadify(program) {

  program.search('#SpreadElement < arguments < #CallExpression').forEach(function(node) {
    applyContext(node);
  });

  program.search('#SpreadElement < elements < #ArrayExpression').forEach(function(node) {

    var elements = node.elements;
    var spread = elements[elements.length - 1];

    elements.replaceChild(spread, spread.argument);

    var spreadId = getSpreadId(program).clone();

    var spreadCall = express(spreadId.name + '()').expression;

    spreadCall.arguments.push.apply(spreadCall.arguments, elements);

    node.parentNode.replaceChild(node, spreadCall);

  });

}

function comprehendify(program) {

  program.search('#ComprehensionExpression').forEach(function(node) {
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

    blocks.forEach(function(block) {
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

    var pushCallExpression = express(comprehensionId.name + '.push()');
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

    identifiers.forEach(function(id) {
      id.name = comprehensionName;
    });

  });

}

// todo: super accessors.
function classify(program) {

  program.search('#Class').forEach(function(node) {
    var definitions = node.body.body;
    var name = node.id.name;
    var scope = node.scope();
    var extendId = getExtendId(program).clone();
    var superClass = node.superClass;

    var superClassDeclaration;

    if (superClass && superClass.type !== syntax.Identifier) {
      var superClassId = getUniqueId(scope, 'Super' + capitalize(name));
      superClassDeclaration = new nodes.VariableDeclaration({
        declarations: [ new nodes.VariableDeclarator({ id: superClassId, init: superClass }) ]
      });
      superClass = node.superClass = superClassId.clone();
    }

    var constructorMethod = !!definitions.search('> #MethodDefinition > key[name=constructor]').length;

    if (!constructorMethod) definitions.unshift(new nodes.MethodDefinition({
      key: new nodes.Identifier({ name: 'constructor' }),
      value: superClass ?
        express('(function ' + name + '(...rest) { super(...rest); })').expression :
        express('(function ' + name + '() {})').expression
    }));

    if (superClass) definitions.search('>> #CallExpression > callee#Identifier[name=super]').forEach(function(id) {
      var call = id.parentNode;
      var definition = call.parent('#MethodDefinition');
      if (definition.static) return;

      var methodId = definition.key;
      var methodName = methodId.name

      var superMethodXp = methodName === 'constructor' ?
        superClass.clone() :
        express(superClass.name + '.prototype.' + methodName).expression;

      var definitionFunction = definition.value;

      var selfId = (id.scope() !== definitionFunction) ? getSelfId(definitionFunction) : new nodes.ThisExpression;

      call.callee = superMethodXp;

      applyContext(call, selfId);
    });

    var constructorFunction = definitions.search('> #MethodDefinition > key[name=constructor] < * > value')[0];
    definitions.removeChild(constructorFunction.parentNode);
    constructorFunction = new nodes.FunctionDeclaration(constructorFunction);

    if (!superClass) superClass = new nodes.Identifier({ name: 'Object' });

    var prototype = new nodes.ObjectExpression;
    var members = new nodes.ObjectExpression;

    definitions.forEach(function(definition) {
      (definition.static ? members : prototype).properties.push(new nodes.Property({
        key: definition.key,
        value: definition.value,
        kind: definition.kind || 'init'
      }));
    });

    var extendExpression = express(extendId.name + '()');
    extendExpression.expression.arguments.push(superClass, constructorFunction.id.clone(), prototype, members);

    if (node.type === syntax.ClassExpression) {

      var wrapper = express('(function(){})()').expression;
      var body = wrapper.callee.body.body;
      var returnStatement = new nodes.ReturnStatement({
        argument: extendExpression.expression
      });

      if (superClassDeclaration) body.push(superClassDeclaration);
      body.push(constructorFunction);
      body.push(returnStatement);
      node.parentNode.replaceChild(node, wrapper);

    } else {
      node.parentNode.replaceChild(node, constructorFunction);
      insertAfter(constructorFunction, extendExpression);
      if (superClassDeclaration) insertBefore(constructorFunction, superClassDeclaration);
    }

  });
}

// todo: tagged template expressions
function templateify(program) {

  program.search('#TemplateLiteral').forEach(function(node) {

    // create an ordered array of parts to concatenate

    var parts = [];

    var stringFound;

    node.quasis.forEach(function(quasi, i) {
      var cooked = quasi.value.cooked;
      // filter out empty strings
      if (cooked) {
        stringFound = true;
        parts.push(new nodes.Literal({ value: quasi.value.cooked }));
      }
      if (i in node.expressions) parts.push(node.expressions[i]);
    });

    // but always keep one string at least
    if (!stringFound) parts.push(new nodes.Literal({ value: '' }));

    // if parts.length is 1, it means there are no expressions
    // it is simply a string.

    if (parts.length === 1) {
      node.parentNode.replaceChild(node, parts[0]);
      return;
    }

    // create the parent binaryExpression by removing elements from parts

    var bin = new nodes.BinaryExpression({
      operator: '+',
      left: parts.shift(),
      right: parts.pop()
    });

    // now reduce the parts to a single BinaryExpression (if parts are left)

    var binaryExpression = parts.reduceRight(function(bin, part, i) {

      return bin.left = new nodes.BinaryExpression({
        operator: '+',
        left: bin.left,
        right: part
      });

    }, bin);

    node.parentNode.replaceChild(node, bin);

  });

}

var isFor = function(node) {
  var type;
  return node && (type = node.type) && (
    type === syntax.ForStatement ||
    type === syntax.ForInStatement ||
    type === syntax.ForOfStatement
  );
};

var lookupReferenceLetDeclarators = function(node) {
  var name = node.name;
  var identifiers;

  var dec = '#VariableDeclaration[kind=let] #Identifier:declaration[name=' + name + ']';

  while (node = node.parentNode) {
    if (isFor(node) || node.type === syntax.BlockStatement || node.type === syntax.Program) {
      identifiers = node.search('~> ' + dec);
      if (identifiers.length) {
        var ancestor = node.parentNode;
        if (isFor(ancestor)) node = ancestor;
        return [node, identifiers];
      }
    }

  }
};

function letify(program) {

  var lets = program.search('#VariableDeclaration[kind=let]');

  if (!lets.length) return;

  var uniqueNameMap = {};

  // find referenced lets, rename declaration and reference
  program.search(':reference').forEach(function(ref) {
    var parent = ref.parentNode;

    var result = lookupReferenceLetDeclarators(ref);
    if (!result) return;

    var block = result[0], identifiers = result[1];

    var map = uniqueNameMap[block.uid] || (uniqueNameMap[block.uid] = {});

    var scope = block === program ? block : block.scope();

    var name = ref.name;

    identifiers.forEach(function(dec) {

      var uniqueName = map[name] || (map[name] = getUniqueName(scope, name));
      dec.var_name = uniqueName; // save its var_name

    });

    ref.name = map[name];
  });

  lets.forEach(function(node) {
    node.kind = 'var';
  });

  lets.search('#Identifier:declaration').forEach(function(node) {
    if (node.var_name) {
      node.name = node.var_name;
      delete node.var_name;
    } else {
      var uniqueName = getUniqueName(node.scope(), node.name);
      node.name = uniqueName;
    }
  });
}

// add blocks, fix ast woes
function blockify(program) {

  var statementBodies = [
    '#IfStatement > alternate', '#IfStatement > consequent',
    '#ForStatement > body', '#ForInStatement > body', '#ForOfStatement > body',
    '#WhileStatement > body', '#DoWhileStatement > body'
  ].map(function(type) {
    return type + '[type!=BlockStatement]';
  });

  program.search(statementBodies).forEach(function(statement) {
    var parentNode = statement.parentNode;
    var key = parentNode.indexOf(statement);
    parentNode[key] = new nodes.BlockStatement({ body: [ statement ] });
  });

  program.search('#ArrowFunctionExpression[expression=true]').forEach(function(node) {
    node.expression = false;
    node.body = new nodes.BlockStatement({
      body: [ new nodes.ReturnStatement({ argument: node.body }) ]
    });
  });

}

// todo: do not lose loc on replaceChild.

function transform(tree) {
  var program = build(tree);

  blockify(program); // normalize the program

  deshorthandify(program); // remove shorthand properties
  arrowify(program); // transform arrow functions

  comprehendify(program); // transform comprehensions

  forofify(program); // transform for of

  patternify(program); // transform patterns
  defaultify(program); // transform default parameters

  classify(program); // transform classes

  restify(program); // transform rest parameter

  spreadify(program); // transform spread

  templateify(program); // transform string templates

  letify(program); // transform let

  return program.toJSON();
}

module.exports = transform;
