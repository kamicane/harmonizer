'use strict';

import { getSliceId } from '../util/slice';
import { express } from '../util/string';

// transform rest param
export default function restify(program) {

  program.search('#Function[rest!=null]').forEach((node) => {
    var block = node.body.body;
    var length = node.params.length;

    var sliceId = getSliceId(program).clone();

    var declaration = express(`var ${node.rest.name} = ${sliceId.name}.call(arguments, ${length})`);

    node.rest = null;

    block.unshift(declaration);

  });

}
