'use strict';

var build = require('nodes');
var esprima = require('esprima');

exports.express = (string) => build(esprima.parse(string).body[0]);
exports.upper = (string) => string.replace(/^[a-z]/, (a) => a.toUpperCase());
exports.lower = (string) => string.replace(/^[A-Z]/, (a) => a.toLowerCase());
