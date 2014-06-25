/* jshint strict:false */
/* global describe, it */

import { expect } from 'chai';

import { iterator } from '../util/iterators';

Array.prototype['@@iterator'] = function() {
  var i = 0;
  return iterator(() => {
    return (i === this.length) ? { value: void 0, done: true } : { value: this[i++], done: false };
  });
};

describe('harmonizer spread argument', () => {

  var fn = function() {
    var res = [];
    for (var i = 0; i < arguments.length; i++) res.push(arguments[i]);
    return res;
  };

  var obj = {
    sub: {
      fn: function() {
        expect(this).to.equal(obj.sub);
        return fn.apply(null, arguments);
      }
    }
  };

  it('should spread arguments, with one argument', () => {
    var result = fn(...[1,2,3]);
    var result2 = obj.sub.fn(...[1,2,3]);
    expect(result).to.eql([1,2,3]);
    expect(result2).to.eql([1,2,3]);
  });

  it('should spread arguments, with many arguments', () => {
    var result = fn(0, ...[1,2,3]);
    var result2 = obj.sub.fn(0, ...[1,2,3]);
    expect(result).to.eql([0,1,2,3]);
    expect(result2).to.eql([0,1,2,3]);
  });

  it('should spread arrays, with one element', () => {
    var ary = [...[1,2,3]];
    expect(ary).to.eql([1,2,3]);
  });

  it('should spread arrays, with many elements', () => {
    var ary = [0, ...[1,2,3]];
    expect(ary).to.eql([0,1,2,3]);
  });

});
