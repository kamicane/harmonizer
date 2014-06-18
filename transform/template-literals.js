'use strict';

var { nodes } = require('nodes');

// todo: tagged template expressions
function templateify(program) {

  program.search('#TemplateLiteral').forEach((node) => {

    // create an ordered array of parts to concatenate

    var parts = [];

    var stringFound;

    node.quasis.forEach((quasi, i) => {
      var cooked = quasi.value.cooked;
      // filter out empty strings
      if (cooked) {
        stringFound = true;
        parts.push(new nodes.Literal({ value: quasi.value.cooked }));
      }
      if (i in node.expressions) parts.push(node.expressions[i]);
    });

    // but always keep one string at least
    if (!stringFound) parts.push(new nodes.Literal({ value: '' }));

    // if parts.length is 1, it means there are no expressions
    // it is simply a string.

    if (parts.length === 1) {
      node.parentNode.replaceChild(node, parts[0]);
      return;
    }

    // create the parent binaryExpression by removing elements from parts

    var bin = new nodes.BinaryExpression({
      operator: '+',
      left: parts.shift(),
      right: parts.pop()
    });

    // now reduce the parts to a single BinaryExpression (if parts are left)

    parts.reduceRight((bin, part) => {

      return bin.left = new nodes.BinaryExpression({
        operator: '+',
        left: bin.left,
        right: part
      });

    }, bin);

    node.parentNode.replaceChild(node, bin);

  });

}

exports.transform = templateify;
