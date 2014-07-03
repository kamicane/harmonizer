# harmonizer

Live demo: http://kamicane.github.io/harmonizer-demo/

A JavaScript es6 to es5 transpiler.
It is written in es6 syntax, and it gets transpiled by itself.
This project is to be considered in BETA.

## Usage

Command line tool, for publishing to npm (or whatever):

```
npm install harmonizer -g
```

```
cd /path/to/project/written/in/es6/syntax
harmonize --input ./ --output /path/to/project/compiled
cd /path/to/project/compiled
npm publish
```

you can watch source files for changes:

```
harmonize --input ./ --output /path/to/project/compiled --watch
```

you can also exclude files to be harmonized with glob patterns:

```
harmonize --input ./ --output /path/to/project/compiled --watch --passthrough "test/**/*"
```

## commonJS api

It requires a javascript parser that is able to parse es6 syntax, such as esprima#harmony.

```js
var esprima = require('esprima'); // kamicane/esprima#harmony
var escodegen = require('escodegen');
var harmonize = require('harmonizer');

var ast = esprima.parse(sourceFile);

var harmonized = harmonize(ast);

var outputCode = escodegen.generate(harmonized);
```

It clearly supports `{ loc: true }`, though it is not enabled (yet) in the command line tool, because node.js is unable to interpret source maps (yet).

## Runtime

This transpiler does runtime by automatically injecting require calls to specific modules from the [es6-util](https://github.com/kamicane/es6-util) package. The way it works is you depend on the [es6-util](https://github.com/kamicane/es6-util) package in your node package, and harmonizer will require the needed modules for you on demand.

## Features

### Modules

Module syntax is transpiled to commonJS automatically.

```js
module foo from './foo'; // whole module
import foo from './foo'; // default
import { foo, bar } from './foobar'; // many
import { foo as fooey, bar as booey } from './foobar'; // many, different names
import './foo'; // no declaration
```

```js
export default foo; // default
export { foo, bar }; // export many
export { foo as bar }; // different names
export var foo = foo; // export declaration
export function foo(){} // export function declaration
export class Foo(){} // export class declaration
```

### Classes

```js
class Person {
  constructor(name) {
    this.name = name;
  }
  toString() {
    return this.name;
  }
}
class John extends Person {
  constructor() {
    super("John");
  }
  toString() {
    super();
  }
}
console.log(new John);
```

### Spread

Supports many spread arguments. Mix and match.

```js
var array = [4,5,6];
console.log(1,2,3,...array);
```

### Arrow Functions

Arrow functions have prebound this, and unlike lesser transpilers harmonizer does not use the slow `.bind(this)`.
Arrow functions cannot access their own arguments variable.

```js
var identity = (x) => x;

var scoped = (x) => {
  console.log(this);
  var inner = () => {
    console.log(this);
  }
};
```

### Default Parameters

```js
var fnDefaults = function(x = 0, y = 1) {
  console.log(x, y);
};
```

### Rest Parameter

```js
var fnRest = function(...rest) {
  console.log(...rest);
};
```

### For Of Loops

There is a default array iterator in [es6-util](https://github.com/kamicane/es6-util) that gets used automatically when no Symbol.iterator is found on an array object. No globals are harmed.

```js
for (var value of [1,2,3]) console.log(value);
```

### Comprehensions

```js
console.log(...[for (v of [0,1,2,3]) if (v) v]);
```

### Template Literals

```js
var { Name, Last } = { Name: 'John', Last: 'Doe' };
console.log(`${Name} ${Last}`);
```

### Let Declarations

Again, no hacks here. Variables names and references to those declarations are replaced, it will effectively block you from using those outside of the block scope.

```js
for (let x of [1,2,3]) console.log(x);
console.log(x);
```

### Destructuring Assignment

```js
var [a,[b], {c}] = [1,[2],{c: 3}];
console.log(a, b, c);

function destruct([a,b,c]) {
  console.log(a,b,c);
}

destruct([1,2,3]);
```

### Computed Property Keys & Method Definitions

```js
var obj = {
  [(true).toString()]: true,
  [(false).toString()]: false
};

var Cls = class {
  [dynamicMethodName()]() {
    console.log('woHoo');
  }
};
```

## Esprima fixes

I made some rather [crude esprima fixes](https://github.com/kamicane/esprima/tree/harmony) to support certain es6 features. I also pulled in some useful commits from the harmony pull requests.

While harmonizer does not necessarily require an ast generated with my branch of esprima, it will not be able to compile the following features with [ariya/esprima#harmony](https://github.com/ariya/esprima/tree/harmony):

 * arrow functions with a single pattern or default as parameter
 * patterns as assignments in for in and for of statements
 * multiple spread arguments
 * computed method definitions

Refer to the [specific commits](https://github.com/kamicane/esprima/commits/harmony) for a full list of fixes.
