'use strict';

// remove property shorthand and method shorthand
function deshorthandify(program) {
  program.search('#Property').forEach((node) => {
    node.shorthand = false;
    node.method = false;
  });
}

exports.transform = deshorthandify;
