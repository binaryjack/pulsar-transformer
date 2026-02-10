/**
 * Parser.prototype.parse
 * Main entry point - parses tokens into AST
 */

import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IProgramNode } from '../parser.types.js';

Parser.prototype.parse = function (this: IParser): IProgramNode {
  return this.parseProgram();
};
