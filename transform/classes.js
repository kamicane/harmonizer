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

    if (!node.id && node.parentNode.type === syntax.VariableDeclarator) {
      node.id = node.parentNode.id.clone();
    }

    var name = node.id ? node.id.name : 'Class';

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

      // Super Calls

      var q = [
        '>> #CallExpression > callee#MemberExpression[computed=false] > object#Identifier[name=super]',
        '>> #CallExpression > callee#Identifier[name=super]'
      ];

      definitions.search(q).forEach((id) => {
        var definition = id.parent('#MethodDefinition');

        var parentNode = id.parentNode;

        var callExpression, methodName;

        if (parentNode.type === syntax.MemberExpression) {
          callExpression = parentNode.parentNode;
          methodName = parentNode.property.name;
        } else {
          callExpression = parentNode;
          methodName = definition.key.name;
        }

        var superMethodXp;

        if (methodName === 'constructor') {
          superMethodXp = superClass.clone();
        } else {
          superMethodXp = definition.static ?
            express(`${superClass.name}.${methodName}`).expression :
            express(`${superClass.name}.prototype.${methodName}`).expression;
        }

        var selfId;

        if (!definition.static) {
          var definitionFunction = definition.value;

          selfId = (id.scope() !== definitionFunction) ?
            getSelfId(definitionFunction).clone() :
            new nodes.ThisExpression;
        }

        callExpression.callee = superMethodXp;
        applyContext(callExpression, selfId);
      });

    }

    var constructorFunction = definitions.search('> #MethodDefinition > key[name=constructor] < * > value')[0];
    definitions.removeChild(constructorFunction.parentNode);

    if (!superClass) superClass = new nodes.Identifier({ name: 'null' });

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
    var args = extendExpression.expression.arguments;
    args.push(superClass);

    if (node.type === syntax.ClassExpression) {

      // todo: figure out a nice name based on variable name.
      if (!constructorFunction.id) constructorFunction.id = new nodes.Identifier({ name: name });

      args.push(constructorFunction);

      if (superClassDeclaration) {
        var wrapper = express('(function(){})()').expression;
        var body = wrapper.callee.body.body;
        var returnStatement = new nodes.ReturnStatement({
          argument: extendExpression.expression
        });

        if (superClassDeclaration) body.push(superClassDeclaration);
        body.push(returnStatement);

        node.parentNode.replaceChild(node, wrapper);

      } else {
        node.parentNode.replaceChild(node, extendExpression.expression);
      }

    } else {

      constructorFunction = new nodes.FunctionDeclaration(constructorFunction);
      constructorFunction.id = node.id;
      args.push(constructorFunction.id.clone());
      node.parentNode.replaceChild(node, constructorFunction);
      insertAfter(constructorFunction, extendExpression);
      if (superClassDeclaration) insertBefore(constructorFunction, superClassDeclaration);
    }

    args.push(prototype);
    if (members.properties.length) args.push(members);

  });

}

exports.transform = classify;
