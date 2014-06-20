/* jshint strict:false */
/* global describe, it */

var { expect } = require('chai');

var { keys, values, entries } = require('../util/iterators');

describe('harmonizer let declarations', () => {

  it('should not leak', () => {
    var x;
    {
      let x = 10;
      expect(x).to.equal(10);
    }
    expect(x).to.equal(undefined);
  });

  it('should not leak unreferenced', () => {
    var x;
    {
      let x = 10;
      let y;
    }
    expect(x).to.equal(undefined);
    expect(typeof y).to.equal('undefined');
  });

  it('should not leak in for statements', () => {

    var c = 0;
    for (let x = 0; x < 10; x++) {
      c++;
    }
    expect(c).to.equal(10);
    expect(typeof x).to.equal('undefined');
  });

  it('should not leak in for of statements', () => {

    var c = 0;
    for (let x of values([1,2,3])) {
      c++;
    }
    expect(c).to.equal(3);
    expect(typeof x).to.equal('undefined');
  });

  it('should not leak in for in statements', () => {

    var c = 0;
    for (let x in {a:1, b:2, c:3}) {
      c++;
    }
    expect(c).to.equal(3);
    expect(typeof x).to.equal('undefined');
  });

});
