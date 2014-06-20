'use strict';

var { nodes } = require('nodes');
var syntax = require('nodes/syntax.json');

var { getSpreadId } = require('../util/spread');
var { express, lower } = require('../util/string');
var { getUniqueId } = require('../util/id');
var { values } = require('../util/iterators');
var { insertBefore } = require('../util/insertion');

var applyContext = (node, context) => {
  var args = node.arguments;
  var spread = args[args.length - 1];

  var isSpread = spread && spread.type === syntax.SpreadElement;

  if (!context && !isSpread) return;

  var propertyName;

  if (isSpread) {
    args.replaceChild(spread, spread.argument);

    var spreadId = getSpreadId(node.root).clone();

    var spreadCall = express(`${spreadId.name}()`).expression;

    spreadCall.arguments.push(...values(args));

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

// esprima bug: the spread element is only accepted as the last argument / element
// I chose not to implement spread the "right" way until esprima gets fixed, since there is no js parser for it.
function spreadify(program) {

  program.search('#SpreadElement < arguments < #CallExpression').forEach((node) => {
    applyContext(node);
  });

  program.search('#SpreadElement < elements < #ArrayExpression').forEach((node) => {

    var elements = node.elements;
    var spread = elements[elements.length - 1];

    elements.replaceChild(spread, spread.argument);

    var spreadId = getSpreadId(program).clone();

    var spreadCall = express(`${spreadId.name}()`).expression;

    spreadCall.arguments.push(...values(elements));

    node.parentNode.replaceChild(node, spreadCall);

  });

}

exports.transform = spreadify;
exports.applyContext = applyContext;
