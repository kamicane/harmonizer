/* jshint strict:false */
/* global describe, it */

import { expect } from 'chai';

describe('harmonizer default params', () => {

  it('should assign default values when missing', () => {

    var fn = function(a=10, x, b=20) {
      return [a, b];
    };

    var [a1, b1] = fn();

    expect(a1).to.equal(10);
    expect(b1).to.equal(20);

    var [a2, b2] = fn(0, null, false);

    expect(a2).to.equal(0);
    expect(b2).to.equal(false);

    var [a3, b3] = fn(undefined, null, 50);

    expect(a3).to.equal(10);
    expect(b3).to.equal(50);

    var [a4, b4] = fn(20);

    expect(a4).to.equal(20);
    expect(b4).to.equal(20);

  });

});
