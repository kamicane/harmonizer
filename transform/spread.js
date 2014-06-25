'use strict';

import { nodes, syntax } from 'nodes';

import { express, lower } from '../util/string';
import { getUniqueId, createUniqueDeclaration } from '../util/id';

var spreadList = function(node, list) {
  var spreadId = createUniqueDeclaration(
    node.root, 'spread', 'require("es6-util/iterator/spread").default'
  );

  list.forEachRight((arg, i) => {
    var isSpread = arg.type === syntax.SpreadElement;
    if (isSpread) {
      var spreadCall = express(`${spreadId.name}()`).expression;
      spreadCall.arguments.push(arg.argument);
      list.splice(i, 1, spreadCall);
    } else {
      var newArg = (i === 0 || arg.type !== syntax.Literal) ?
        new nodes.ArrayExpression({ elements: [ arg ] }) :
        arg;

      list.splice(i, 0, newArg);
    }
  });

  if (list.length > 1) {
    var concatExpression = express(`$.concat()`).expression;
    concatExpression.callee.object = list.shift();

    list.forEachRight(function(arg) {
      concatExpression.arguments.unshift(arg);
    });

    list.splice(0, list.length, concatExpression);
  }
};

export var applyContext = (node, context) => {
  var args = node.arguments;

  var hasSpreads = !!args.search('> #SpreadElement').length;

  // nothing to do
  if (!hasSpreads && !context) return;

  var propertyName;

  if (hasSpreads) {
    spreadList(node, args);
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
        var scope = node.scope();
        var contextId = getUniqueId(scope, lower(object.type));
        var body = nodes.Function.test(scope) ? scope.body.body : scope.body;

        var declaration = express(`var ${contextId.name}`);
        body.unshift(declaration);

        callee.object = new nodes.AssignmentExpression({
          left: contextId.clone(),
          operator: '=',
          right: object
        });

        object = contextId;
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

export default function spreadify(program) {

  program.search('#SpreadElement < arguments < #CallExpression').forEach((node) => {
    applyContext(node);
  });

  program.search('#SpreadElement < elements < #ArrayExpression').forEach((node) => {
    var elements = node.elements;
    spreadList(node, elements);
    node.parentNode.replaceChild(node, node.elements[0]);

  });

}
