'use strict';

import { build } from 'nodes';
import { parse } from 'esprima';

export var express = (string) => build(parse(string).body[0]);
export var upper = (string) => string.replace(/^[a-z]/, (a) => a.toUpperCase());
export var lower = (string) => string.replace(/^[A-Z]/, (a) => a.toLowerCase());
