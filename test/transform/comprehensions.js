/* jshint strict:false */
/* global describe, it */

// These tests were pretty much copied and pasted from:
// https://raw.githubusercontent.com/dreame4/es6-comprehensions/master/test/parser_test.js
// BSD-2-Clause licensed.

var { expect } = require('chai');

var iterator = (next) => {
  var it = { next };
  it['@@iterator'] = () => it;
  return it;
};

Array.prototype['@@iterator'] = function() {
  var i = 0;
  return iterator(() => {
    return (i === this.length) ? { value: void 0, done: true } : { value: this[i++], done: false };
  });
};

describe('harmonizer comprehensions', () => {

  it('should support no filter', () => {
    var result = [ for (x of [1,2,3]) x ];
    expect(result).to.eql([1,2,3]);
  });

  it('should support filter', () => {
    var result = [ for (x of [1,2,3]) if (x > 2) x ];
    expect(result).to.eql([3]);
  });

  it('should support nested blocks', () => {
    var result1 = [ for (x of [1,2,3]) for (y of [1,2]) x ];
    expect(result1).to.eql([1,1,2,2,3,3]);
    var result2 = [ for (x of [1,2,3]) for (y of [1,2]) y ];
    expect(result2).to.eql([1,2,1,2,1,2]);
  });

  it('should support nested blocks and filter', () => {
    var result = [ for (x of [1,2,3]) for (y of [1,2]) if (y > 1 && x > 1) y ];
    expect(result).to.eql([2,2]);
  });

  it('should support complex body', () => {
    function add(a, b) { return a + b; }
    var result = [ for (x of [1,1,1]) for (y of [2]) add(x, y) ];
    expect(result).to.eql([3,3,3]);
  });

  it('should support complex body, part 2', () => {
    var result = [ for (x of [1,2]) for (y of [1,2]) x * y ];;
    expect(result).to.eql([1,2,2,4]);
  });

  it('should support this', () => {

    function Comprehend() {
      this.arr1 = [1, 2];
      this.arr2 = [1, 2];
      this.add = function(a, b) {
        return a + b;
      };

      return [ for (x of this.arr1) for (y of this.arr2) this.add(x, y) ];;
    };

    expect(new Comprehend).to.eql([2,3,3,4]);
  });

  it('should use (badly implemented) iterators', () => {
    var index = 1;
    var iter = iterator(() => {
      if (index > 3) {
        return {value: void 0, done: true};
      } else {
        return {value: index++, done: false};
      }
    });
    var result = [ for (x of iter) x ];
    expect(result).to.eql([1, 2, 3]);
  });

});
