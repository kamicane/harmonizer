/* jshint strict:false */
/* global describe, it */

var { expect } = require('chai');

describe('harmonizer patterns', () => {

  it('should parse simple array patterns', () => {
    var [] = [];

    var [ a, b ] = [ 1, 2 ];
    expect(a).to.equal(1);
    expect(b).to.equal(2);

    var c;

    [ a, b ] = [ 2, 3 ], c = 4;
    expect(a).to.equal(2);
    expect(b).to.equal(3);
    expect(c).to.equal(4);
  });

  it('should parse simple array patterns, part 2', () => {
    var [ a, b, [ c ] ];
    expect(a).to.equal(undefined);
    expect(b).to.equal(undefined);
    expect(c).to.equal(undefined);

    var ary = [ 2, 3 ];
    [ a, b ] = ary;
    expect(a).to.equal(2);
    expect(b).to.equal(3);
  });

  it('should ignore empty array patterns', () => {
    var [,,,[]], [];
  });

  it('should parse simple array patterns in function params', () => {
    var fn = function([ a, b ], []) {
      return [ a, b ];
    };
    var [ a1, b1 ] = fn([ 1, 2 ]);
    expect(a1).to.equal(1);
    expect(b1).to.equal(2);
  });

  it('should parse simple object patterns', () => {
    var {} = {};

    var { a, b } = { a: 1, b: 2 };
    expect(a).to.equal(1);
    expect(b).to.equal(2);

    // esprima bug: unexpected token =
    // { a, b } = { a: 2, b: 3 };
    // expect(a).to.equal(2);
    // expect(b).to.equal(3);
  });

  it('should ignore empty object patterns', () => {
    var {x: {y: {}}}, {};
  });

  it('should parse simple object patterns, part 2', () => {
    var { a, b, y: {e: {}} };
    expect(a).to.equal(undefined);
    expect(b).to.equal(undefined);

    var obj = { a: 2, b: 3 };

    var { a, b } = obj;
    expect(a).to.equal(2);
    expect(b).to.equal(3);
  });

  it('should parse simple object patterns in function params', () => {
    var fn = function({ a, b }, {}) {
      return [ a, b ];
    };
    var [ a1, b1 ] = fn({ a: 1, b: 2 });
    expect(a1).to.equal(1);
    expect(b1).to.equal(2);
  });

  it('should parse nested array patterns', () => {
    var [,a, [b], {c, p: [d]},[]] = [null, 1, [2], {c: 3, p: [4]}];
    expect([a, b, c, d]).to.eql([1,2,3,4]);
  });

  it('should parse nested object patterns', () => {
    var {a, x: [b], y: {c, p: [d]}, z: {}} = {a: 1, x: [2], y: {c: 3, p: [4]}};
    expect([a, b, c, d]).to.eql([1,2,3,4]);
  });

});
