'use strict';

import { build, nodes } from 'nodes';

import deshorthandify from './transform/shorthands';
import arrowify from './transform/arrow-functions';
import comprehendify from './transform/comprehensions';
import forofify from './transform/for-of';
import patternify from './transform/patterns';
import defaultify from './transform/default-params';
import classify from './transform/classes';
import restify from './transform/rest-param';
import spreadify from './transform/spread';
import templateify from './transform/template-literals';
import letify from './transform/let-declarations';
import modulize from './transform/modules';

// todo: do not lose loc on replaceChild.

export function transform(tree) {
  var program = build(tree);

  modulize(program); // transform modules

  deshorthandify(program); // remove shorthand properties
  arrowify(program); // transform arrow functions

  comprehendify(program); // transform comprehensions

  forofify(program); // transform for of

  patternify(program); // transform patterns
  defaultify(program); // transform default parameters

  classify(program); // transform classes

  restify(program); // transform rest parameter

  spreadify(program); // transform spread

  templateify(program); // transform string templates

  letify(program); // transform let

  return program.toJSON();
}

export default transform;
