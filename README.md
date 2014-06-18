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
