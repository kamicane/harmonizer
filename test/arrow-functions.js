/* jshint strict:false */
/* global describe, it */

// These tests were pretty much copied and pasted from:
// https://github.com/square/es6-arrow-function/test/examples
// Apache 2 licensed.
// https://github.com/square/esnext/blob/master/LICENSE

// These tests are compiled first (with harmonizer cli), then run.

var expect = require('chai').expect;

describe('harmonizer arrow functions', () => {

  it('should support arguments to parent function', () => {

    function makeMultiplier() {
      // `arguments` should refer to `makeMultiplier`'s arguments.
      return (n) => [].slice.call(arguments).reduce((a, b) => a * b) * n;
    }

    function toArray() {
      // Intentionally nest arrow functions to ensure `arguments` is put inside
      // `toArray`'s scope.
      return (() => (arguments, (() => [].slice.call(arguments)).call())).call();
    }

    function returnDotArguments(object) {
      // Ensure `arguments` is not treated as a reference to the magic value.
      return (() => object.arguments).call();
    }

    function returnArgumentsObject() {
      // Ensure `arguments` is not treated as a reference to the magic value.
      return (() => ({arguments: 1})).call();
    }

    function makeArgumentsReturner() {
      return (() => function() {
        return [].slice.call(arguments);
      }).call();
    }

    // i.e. 2 * 3 * 4 == 24, not 16 (4 * 4)
    expect(makeMultiplier(2, 3)(4)).to.equal(24);
    expect(toArray(1, 2, 3)).to.eql([1, 2, 3]);
    expect(returnDotArguments({arguments: 1})).to.equal(1);
    expect(returnArgumentsObject()).to.eql({arguments: 1});
    expect(makeArgumentsReturner()(1, 2, 3)).to.eql([1, 2, 3]);

  });

  it('should keep this inside normal functions', () => {
    var dynamicThisGetter = () => function(){ return this; };
    expect(dynamicThisGetter.call(10)()).to.not.equal(10);
  });

  it('should return undefined', () => {
    var empty = () => {};
    expect(empty()).to.equal(undefined);
  });

  it('should keep binding between arrow functions', () => {
    var obj = {
      method: function() {
        return () => (this, () => this);
      }
    };

    expect(obj.method()()()).to.equal(obj);
  });

  it('should allow no parens for one argument', () => {
    var square = x => x * x;
    expect(square(4)).to.equal(16);
  });

  it('should be allowed to be used as an expression', () => {
    var odds = [0, 2, 4].map(v => v + 1);
    expect(odds).to.eql([1, 3, 5]);
  });

});
