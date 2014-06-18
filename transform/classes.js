'use strict';

var { nodes } = require('nodes');
var syntax = require('nodes/syntax.json');

var { applyContext } = require('./spread');

var { insertAfter, insertBefore } = require('../util/insertion');
var { upper, express } = require('../util/string');
var { getUniqueId } = require('../util/id');
var { getExtendId } = require('../util/extend');
var { getSelfId } = require('../util/self');

// todo: super accessors.
function classify(program) {

  program.search('#Class').forEach((node) => {
    var definitions = node.body.body;
    var name = node.id.name;
    var scope = node.scope();
    var extendId = getExtendId(program).clone();
    var superClass = node.superClass;

    var superClassDeclaration;

    if (superClass && superClass.type !== syntax.Identifier) {
      var superClassId = getUniqueId(scope, `Super${upper(name)}`);
      superClassDeclaration = new nodes.VariableDeclaration({
        declarations: [ new nodes.VariableDeclarator({ id: superClassId, init: superClass }) ]
      });
      superClass = node.superClass = superClassId.clone();
    }

    var constructorMethod = !!definitions.search('> #MethodDefinition > key[name=constructor]').length;

    if (!constructorMethod) definitions.unshift(new nodes.MethodDefinition({
      key: new nodes.Identifier({ name: 'constructor' }),
      value: superClass ?
        express(`(function () { ${superClass.name}.apply(this, arguments); })`).expression :
        express('(function () {})').expression
    }));

    if (superClass) {

      var q = [
        '>> #CallExpression > callee#MemberExpression[computed=false] > object#Identifier[name=super]',
        '>> #CallExpression > callee#Identifier[name=super]'
      ];

      definitions.search(q).forEach((id) => {
        var definition = id.parent('#MethodDefinition');
        if (definition.static) return;

        var parentNode = id.parentNode;

        var callExpression, methodName;

        if (parentNode.type === syntax.MemberExpression) {
          callExpression = parentNode.parentNode;
          methodName = parentNode.property.name;
        } else {
          callExpression = parentNode;
          methodName = definition.key.name;
        }

        var superMethodXp = methodName === 'constructor' ?
          superClass.clone() :
          express(`${superClass.name}.prototype.${methodName}`).expression;

        var definitionFunction = definition.value;

        var selfId = (id.scope() !== definitionFunction) ?
          getSelfId(definitionFunction).clone() :
          new nodes.ThisExpression;

        callExpression.callee = superMethodXp;

        applyContext(callExpression, selfId);
      });


    }

    var constructorFunction = definitions.search('> #MethodDefinition > key[name=constructor] < * > value')[0];
    constructorFunction.id = node.id;
    definitions.removeChild(constructorFunction.parentNode);

    constructorFunction = new nodes.FunctionDeclaration(constructorFunction);

    if (!superClass) superClass = new nodes.Identifier({ name: 'Object' });

    var prototype = new nodes.ObjectExpression;
    var members = new nodes.ObjectExpression;

    definitions.forEach((definition) => {
      (definition.static ? members : prototype).properties.push(new nodes.Property({
        key: definition.key,
        value: definition.value,
        kind: definition.kind || 'init'
      }));
    });

    var extendExpression = express(`${extendId.name}()`);
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

exports.transform = classify;
