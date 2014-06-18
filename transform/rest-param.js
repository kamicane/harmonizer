'use strict';

var { getSliceId } = require('../util/slice');
var { express } = require('../util/string');

// transform rest param
function restify(program) {

  program.search('#Function[rest!=null]').forEach((node) => {
    var block = node.body.body;
    var length = node.params.length;

    var sliceId = getSliceId(program).clone();

    var declaration = express(`var ${node.rest.name} = ${sliceId.name}.call(arguments, ${length})`);

    node.rest = null;

    block.unshift(declaration);

  });

}

exports.transform = restify;
