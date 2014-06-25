/* jshint strict:false */
/* global describe, it */

module chai from 'chai';
var expect = chai.expect;

var foo = 'foo';
export default foo;
export class X {
  constructor(setMe) {
    setMe.value = 'X';
  }
}
export function y (){
  return 'y';
}
export var z = 'z';
var bar = 'bar', baz = 'baz';
export {bar, baz};

describe('harmonizer modules', () => {

  it('should support export', () => {
    expect(exports.default).to.equal('foo');
    expect(exports.bar).to.equal('bar');
    expect(exports.baz).to.equal('baz');
    var setMe = {};
    new exports.X(setMe);
    expect(setMe.value).to.equal('X');
    expect(exports.y()).to.equal('y');
    expect(exports.z).to.equal('z');
  });

});
