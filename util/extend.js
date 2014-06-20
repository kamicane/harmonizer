'use strict';

var { nodes } = require('nodes');

var { getUniqueName } = require('./id');
var { express } = require('./string');

var extend = `function (SuperClass, Class, prototype, members) {
  var descriptors = function(object) {
    var base = {}, descriptor;
    for (var key in object) {
      descriptor = Object.getOwnPropertyDescriptor(object, key);
      if (!('get' in descriptor) && !('set' in descriptor)) {
        descriptor.enumerable = false;
      }
      base[key] = descriptor;
    }
    return base;
  };

  if (SuperClass) Class.__proto__ = SuperClass;
  Object.defineProperty(Class, 'prototype', {
    value: Object.create(SuperClass === null ? null : SuperClass.prototype, descriptors(prototype))
  });

  Object.defineProperty(Class.prototype, 'constructor', { value: Class });

  if (members) Object.defineProperties(Class, descriptors(members));
  return Class;
}`;

exports.getExtendId = (node) => {
  if (!node.extendId) {
    var extendName = getUniqueName(node, 'extend');
    var declaration = express(`var ${extendName} = ${extend}`);
    var id = declaration.declarations[0].id;
    var body = nodes.Function.test(node) ? node.body.body : node.body;
    body.unshift(declaration);

    node.extendId = id;
  }

  return node.extendId;
};
