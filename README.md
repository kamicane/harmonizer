# harmonizer

Live demo: http://kamicane.github.io/harmonizer-demo/

A JavaScript es6 to es5 transpiler.
It is written in es6 syntax, and it gets transpiled by itself.
This project is to be considered in ALPHA.

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

## commonJS api

It requires a javascript parser that is able to parse es6 syntax, such as esprima#harmony.

```js
var esprima = require('esprima'); // ariya/esprima#harmony
var escodegen = require('escodegen');
var harmonize = require('harmonizer');

var ast = esprima.parse(sourceFile);

var harmonized = harmonize(ast);

var outputCode = escodegen.generate(harmonized);
```

It clearly supports `{ loc: true }`, though it is not enabled (yet) in the command line tool, because node.js is unable to interpret source maps.

## Features

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

```js
var array = [4,5,6];
console.log(1,2,3,...array);
```

### Arrow Functions

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

```js
for (let x of [1,2,3]) console.log(x);
console.log(x);
```

### Destructuring assignment

```js
var [a,[b], {c}] = [1,[2],{c: 3}];
console.log(a, b, c);

function destruct([a,b,c]) {
  console.log(a,b,c);
}

destruct([1,2,3]);
```
