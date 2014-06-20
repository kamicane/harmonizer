/* jshint strict:false */
/* global describe, it */

// These tests were pretty much copied and pasted from:
// https://github.com/square/es6-class/tree/master/test/examples
// Apache 2 licensed.
// https://github.com/square/esnext/blob/master/LICENSE

var { expect } = require('chai');

describe('harmonizer classes', () => {

  it('should support anonymous classes', () => {
    var Animal = class {
      sayHi() {
        return 'Hi, I am a '+ this.type() + '.';
      }

      static getName() {
        return 'Animal';
      }
    };

    var Dog = class extends Animal {
      type() { return 'dog'; }

      sayHi() {
        return super() + ' WOOF!';
      }

      static getName() {
        return super() + '/Dog';
      }
    };

    expect(new Dog().sayHi()).to.equal('Hi, I am a dog. WOOF!');
    expect(Dog.getName()).to.equal('Animal/Dog');

    var count = 0;
    var Cat = class extends (function(){ count++; return Animal; })() {};
    Cat;

    expect(count).to.equal(1);
  });

  it('should support super method calls', () => {
    class Animal {
      sayHi() {
        return 'I am an animal.';
      }

      sayOther() {
        return 'WAT?!';
      }
    }

    class Horse extends Animal {
      sayHi() {
        return super.sayOther();
      }

      sayOther() {
        return 'I see dead objects.';
      }
    }

    expect(new Horse().sayHi()).to.equal('WAT?!');

  });

  it('should support class expressions', () => {
    var Person = (class Person {});

    expect(typeof Person).to.equal('function');
    expect((function(){ return (class Person {}); })().name).to.equal('Person');
    expect(typeof (class {})).to.equal('function');
  });

  it('should support extends', () => {
    class Animal {
      sayHi() {
        return 'Hi, I am a '+ this.type() + '.';
      }
    }

    class Dog extends Animal {
      type() { return 'dog'; }

      sayHi() {
        return super() + ' WOOF!';
      }
    }

    expect(new Dog().sayHi()).to.equal('Hi, I am a dog. WOOF!');
  });

  it('should support constructors', () => {

    class Multiplier {
      constructor(n=1) {
        this.n = n;
      }

      multiply(n=1) {
        return n * this.n;
      }
    }

    expect(new Multiplier().n).to.equal(1);
    expect(new Multiplier(6).n).to.equal(6);
    expect(new Multiplier().multiply()).to.equal(1);
    expect(new Multiplier(2).multiply(3)).to.equal(6);

  });

  it('should support method declarations', () => {
    class Person {
      getName() {
        return this.firstName + ' ' + this.lastName;
      }
    }

    var me = new Person();
    me.firstName = 'Brian';
    me.lastName = 'Donovan';
    expect(me.getName()).to.equal('Brian Donovan');

  });

  it('should support empty classes', () => {
    class Foo {
    }

    expect(new Foo().constructor).to.equal(Foo);
    expect(new Foo() instanceof Foo).to.be.ok;
  });

  it('should have non enumerable prototype methods', () => {

    class Point {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }

      toString() {
        return '(' + this.x + ', ' + this.y + ')';
      }
    }

    var point = new Point(1, 2);
    var keys = [];

    for (var key in point) {
      keys.push(key);
    }

    expect(point.toString()).to.equal('(1, 2)');
    expect(keys.sort()).to.eql(['x', 'y']);

  });

  it('should support extending null', () => {

    class Obj extends null {}

    expect(Obj.toString).to.equal(Function.toString);
    expect(new Obj().toString).to.equal(undefined);

  });

  it('should support setters and getters', () => {
    class Person {
      constructor(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
      }

      get name() {
        return this.firstName + ' ' + this.lastName;
      }

      set name(name) {
        var parts = name.split(' ');
        this.firstName = parts[0];
        this.lastName = parts[1];
      }
    }

    var mazer = new Person('Mazer', 'Rackham');
    expect(mazer.name).to.equal('Mazer Rackham');
    mazer.name = 'Ender Wiggin';
    expect(mazer.firstName).to.equal('Ender');
    expect(mazer.lastName).to.equal('Wiggin');

    var forLoopProperties = [];
    for (var key in mazer) {
      forLoopProperties.push(key);
    }

    expect(forLoopProperties.indexOf('name') > -1).to.be.ok;

  });

  it('should support implicit superclass', () => {

    class Obj {
      constructor() {
        super();
      }
    }

    new Obj();

  });

  it('should have writable methods', () => {

    var value;

    class Foo {
      foo() {
        value = 1;
      }
    }

    var foo = new Foo();
    foo.foo = function() { value = 2; };
    foo.foo();
    expect(value).to.equal(2);

  });

  it('should support rest params', () => {

    class Joiner {
      constructor(string) {
        this.string = string;
      }

      join(...items) {
        return items.join(this.string);
      }

      static join(string, ...items) {
        var joiner = new this(string);
        return joiner.join(...items);
      }
    }

    class ArrayLike {
      constructor(...items) {
        items.forEach((item, i) => {
          this[i] = item;
        });
        this.length = items.length;
      }
    }

    var joiner = new Joiner(' & ');

    expect(joiner.join(4, 5, 6)).to.equal('4 & 5 & 6');
    expect(new ArrayLike('a', 'b')[1]).to.equal('b');

  });

  it('should support static methods', () => {

    class Tripler {
      static triple(n=1) {
        return n * 3;
      }

      static toString() {
        return '3' + super() + '3';
      }
    }

    class MegaTripler extends Tripler {
      static triple(n=1) {
        return super(n) * super(n);
      }
    }

    var tripler = new Tripler();

    expect(Tripler.triple()).to.equal(3);
    expect(Tripler.triple(2), 6);
    expect(tripler.triple, undefined);

    expect(Tripler.toString()).to.equal('3' + Object.toString.call(Tripler) + '3');

    var mega = new MegaTripler();

    expect(MegaTripler.triple(2)).to.equal(36);
    expect(mega.triple).to.equal(undefined);

    expect(MegaTripler.toString()).to.equal('3' + Object.toString.call(MegaTripler) + '3');


  });

  it('should support changing the __proto__', () => {
    var log = '';

    class Base {
      p() { log += '[Base]'; }
    }

    class OtherBase {
      p() { log += '[OtherBase]'; }
    }
    class Derived extends Base {
      p() {
        log += '[Derived]';
        super();
        Derived.prototype.__proto__ = OtherBase.prototype;
        super();
      }
    }

    new Derived().p();
    expect(log).to.equal('[Derived][Base][OtherBase]');

  });

  it ('should support this expressions in superClasses', () => {

    var Classificator = function() {
      this.Super = class {};
      var Sub = class extends this.Super {};
      expect((new Sub()) instanceof this.Super).to.be.ok;
    };

    new Classificator();

  });

  it ('should support super expressions in functions', () => {
    var expected;

    class Bar {
      constructor() {
        expected = true;
      }
    }

    class Foo extends Bar {
      constructor() {

        (function() {
          super();
        })();

      }
    }

    new Foo();

    expect(expected).to.be.ok;

  });

});
