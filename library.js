'use strict';

var Symbol = global.Symbol || { iterator: '@@iterator' };

if (!(Symbol.iterator in Array.prototype)) Object.defineProperty(Array.prototype, Symbol.iterator, {
  writable: true,
  configurable: true,
  value: function() {
    var array = this, i = 0;
    return {
      next: function() {
        if (i === array.length) return { value: void 0, done: true };
        return { value: array[i++], done: false };
      }
    };
  }
});

exports.Symbol = Symbol;
