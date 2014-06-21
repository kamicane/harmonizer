'use strict';

var { getUniqueName } = require('./id');
var { express } = require('./string');
var { insertAfterStrict } = require('./insertion');

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
    insertAfterStrict(node, declaration);
    node.extendId = declaration.declarations[0].id;
  }

  return node.extendId;
};
