/* jshint strict:false */
/* global describe, it */

var { expect } = require('chai');

var { keys, values, entries } = require('../util/iterators');

describe('harmonizer for of statements', () => {

  it('should loop array values', () => {
    var result = [];
    for (var value of values([1,2,3])) result.push(value);
    expect(result).to.eql([1,2,3]);
  });

  it('should loop object values', () => {
    var result = [];
    for (var value of values({ a:1, b:2, c:3 })) result.push(value);
    expect(result).to.eql([1,2,3]);
  });

  it('should loop array keys', () => {
    var result = [];
    for (var value of keys([1,2,3])) result.push(value);
    expect(result).to.eql([0,1,2]);
  });

  it('should loop object keys', () => {
    var result = [];
    for (var value of keys({ a:1, b:2, c:3 })) result.push(value);
    expect(result).to.eql(['a','b','c']);
  });

  it('should loop array entries', () => {
    var result = [];
    for (var [key, value] of entries([1,2,3])) result.push(key, value);
    expect(result).to.eql([0, 1, 1, 2, 2, 3]);
  });

  it('should loop object entries', () => {
    var result = [];
    for (var [key, value] of entries({ a:1, b:2, c:3 })) result.push(key, value);
    expect(result).to.eql(['a', 1, 'b', 2, 'c', 3]);
  });

  it('should work with assignment', () => {
    var result = [];
    var value;
    for (value of values({ a:1, b:2, c:3 })) result.push(value);
    expect(result).to.eql([1, 2, 3]);
  });

});
