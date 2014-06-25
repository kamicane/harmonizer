'use strict';

// remove property shorthand and method shorthand
export default function deshorthandify(program) {
  program.search('#Property').forEach((node) => {
    node.shorthand = false;
    node.method = false;
  });
}
