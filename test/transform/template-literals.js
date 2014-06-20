/* jshint strict:false */
/* global describe, it */

var { expect } = require('chai');

describe('harmonizer template literals', () => {

  it('should parse simple templates', () => {
    var a = `string`;
    expect(a).to.equal('string');

    var number = 10;
    var a2 = `${number}`;
    expect(a2).to.equal('10');
  });

  it('should parse complex templates', () => {
    var a = 1, b = 2, c = 3;
    var abc = `${a} ${b} ${c}`;
    expect(abc).to.equal('1 2 3');

    var add = function(x) {
      return x + 1;
    };

    var abc2 = `${add(a)} ${add(b)} ${add(c)}`;
    expect(abc2).to.equal('2 3 4');
  });

});
