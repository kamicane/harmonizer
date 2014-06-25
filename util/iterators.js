'use strict';

export var iterator = (next) => {
  var it = { next };
  it['@@iterator'] = () => it;
  return it;
};

var arrayValuesNext = (array) => {
  var i = 0;
  return () => (i === array.length) ? { value: void 0, done: true } : { value: array[i++], done: false };
};

var arrayKeysNext = (array) => {
  var i = 0;
  return () => (i === array.length) ? { value: void 0, done: true } : { value: i++, done: false };
};

var arrayEntriesNext = (array) => {
  var i = 0;
  return () => (i === array.length) ? { value: void 0, done: true } : { value: [ i, array[i++] ], done: false };
};

var objectValuesNext = (object) => {
  var keys = Object.keys(object), i = 0;
  return () => (i === keys.length) ? { value: void 0, done: true } : { value: object[keys[i++]], done: false };
};

var objectKeysNext = (object) => {
  var keys = Object.keys(object), i = 0;
  return () => (i === keys.length) ? { value: void 0, done: true } : { value: keys[i++], done: false };
};

var objectEntriesNext = (object) => {
  var keys = Object.keys(object), i = 0;
  return () => {
    if (i === keys.length) return { value: void 0, done: true };
    var key = keys[i++], value = object[key];
    return { value: [key, value], done: false };
  };
};

export var values = function values(object) {
  return iterator(object instanceof Array ? arrayValuesNext(object) : objectValuesNext(object));
};

export var keys = function keys(object) {
  return iterator(object instanceof Array ? arrayKeysNext(object) : objectKeysNext(object));
};

export var entries = function entries(object) {
  return iterator(object instanceof Array ? arrayEntriesNext(object) : objectEntriesNext(object));
};
