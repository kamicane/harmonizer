/* jshint strict:false */
/* global describe, it */

var { expect } = require('chai');

describe('harmonizer rest param', () => {

  it('should convert the rest param to an array', () => {
    var fn = function(...rest) {
      return rest;
    };

    var result = fn(1,2,3);
    expect(Array.isArray(result)).to.be.ok;
    expect(result).to.eql([1,2,3]);
  });

  it('should convert the rest param to an array, with arguments before it', () => {
    var fn = function(a, ...rest) {
      return rest;
    };

    var result = fn(0,1,2,3);
    expect(Array.isArray(result)).to.be.ok;
    expect(result).to.eql([1,2,3]);
  });

});
