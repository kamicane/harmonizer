'use strict';

var build = require('nodes');

var { values } = require('./util/iterators');

var { transform: deshorthandify } = require('./transform/shorthands');
var { transform: arrowify } = require('./transform/arrow-functions');
var { transform: comprehendify } = require('./transform/comprehensions');
var { transform: forofify } = require('./transform/for-of');
var { transform: patternify } = require('./transform/patterns');
var { transform: defaultify } = require('./transform/default-params');
var { transform: classify } = require('./transform/classes');
var { transform: restify } = require('./transform/rest-param');
var { transform: spreadify } = require('./transform/spread');
var { transform: templateify } = require('./transform/template-literals');
var { transform: letify } = require('./transform/let-declarations');

var { nodes } = build;

// add blocks
function blockify(program) {

  var statementBodies = [ for (selector of values([
    '#IfStatement > alternate', '#IfStatement > consequent',
    '#ForStatement > body', '#ForInStatement > body', '#ForOfStatement > body',
    '#WhileStatement > body', '#DoWhileStatement > body'
  ])) `${selector}[type!=BlockStatement]` ];

  program.search(statementBodies).forEach((statement) => {
    var parentNode = statement.parentNode;
    var key = parentNode.indexOf(statement);
    parentNode[key] = new nodes.BlockStatement({ body: [ statement ] });
  });

  program.search('#ArrowFunctionExpression[expression=true]').forEach((node) => {
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
