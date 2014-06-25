'use strict';

import { nodes, syntax } from 'nodes';

import { applyContext } from './spread';

import { insertAfter } from '../util/insertion';
import { express, upper } from '../util/string';
import { getUniqueId, createUniqueDeclaration } from '../util/id';

// todo: super accessors.
export default function classify(program) {

  program.search('#Class').forEach((node) => {
    var definitions = node.body.body;

    if (!node.id && node.parentNode.type === syntax.VariableDeclarator) {
      node.id = new nodes.Identifier({ name: upper(node.parentNode.id.name) });
    }

    if (!node.id) node.id = getUniqueId(node, 'Class');

    var name = node.id.name;

    var getPrototypeOfNamePrototype = `Object.getPrototypeOf(${name}.prototype)`;
    var getPrototypeOfName = `Object.getPrototypeOf(${name})`;

    var createClassId = createUniqueDeclaration(
      program, 'createClass', 'require("es6-util/class/create").default'
    );

    var superClass = node.superClass;

    var constructorMethod = !!definitions.search('> #MethodDefinition > key[name=constructor]').length;

    if (!constructorMethod) definitions.unshift(new nodes.MethodDefinition({
      key: new nodes.Identifier({ name: 'constructor' }),
      value: express(`(function () {
        var proto = ${getPrototypeOfNamePrototype};
        if (proto !== null) proto.constructor.apply(this, arguments);
      })`).expression
    }));

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

      var superMethodXp = definition.static ?
        express(`${getPrototypeOfName}.${methodName}`).expression :
        express(`${getPrototypeOfNamePrototype}.${methodName}`).expression;

      var selfId;

      var definitionFunction = definition.value;

      selfId = (id.scope() !== definitionFunction) ?
        createUniqueDeclaration(definitionFunction, 'self', 'this') :
        new nodes.ThisExpression;

      callExpression.callee = superMethodXp;
      applyContext(callExpression, selfId);
    });

    var constructorFunction = definitions.search('> #MethodDefinition > key[name=constructor] < * > value')[0];
    constructorFunction.id = new nodes.Identifier({ name: name });

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

    var createClassExpression = express(`${createClassId.name}()`);
    var args = createClassExpression.expression.arguments;

    if (node.type === syntax.ClassExpression) {

      var wrapper = express('(function(){})()').expression;

      wrapper.arguments.push(superClass);
      var body = wrapper.callee.body.body;
      var returnStatement = new nodes.ReturnStatement({
        argument: createClassExpression.expression
      });

      body.push(constructorFunction);
      body.push(returnStatement);

      node.parentNode.replaceChild(node, wrapper);

      superClass = getUniqueId(wrapper, 'Super' + upper(constructorFunction.id.name));

      wrapper.callee.params.push(superClass.clone());

    } else {
      node.parentNode.replaceChild(node, constructorFunction);
      insertAfter(constructorFunction, createClassExpression);
    }

    args.push(superClass, constructorFunction.id.clone(), prototype);
    if (members.properties.length) args.push(members);

  });

}
