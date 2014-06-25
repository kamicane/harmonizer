'use strict';

import { express } from '../util/string';

export default function defaultify(program) {

  program.search('#Function').forEach((fn) => {
    if (fn.defaults.length === 0) return;

    var params = fn.params;
    var defaults = fn.defaults;

    defaults.forEachRight((node, i) => {
      if (node == null) return defaults.removeChild(node);

      var param = params[i];
      var statement = express(`if (${param.name} === void 0) ${param.name} = $`);
      statement.consequent.expression.right = node;
      fn.body.body.unshift(statement);
    });

  });
}
