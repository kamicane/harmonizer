'use strict';

var { nodes } = require('nodes');

var { getUniqueName } = require('./id');
var { express } = require('./string');

var extend = (SuperClass, Class, prototype, members) => {
  var descriptors = (base, object) => {
    for (var key in object) base[key] = Object.getOwnPropertyDescriptor(object, key);
    return base;
  };
  Object.defineProperty(Class, 'prototype', {
    value: Object.create(SuperClass.prototype, descriptors({ value: Class }, prototype))
  });
  return Object.defineProperties(Class, descriptors({}, members));
};

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
