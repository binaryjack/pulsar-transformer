/**
 * Parser.prototype.match
 * Check if current token matches any of given types
 */

import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

Parser.prototype.match = function (this: IParser, ...types: string[]): boolean {
  const currentType = this.peek().type;
  return types.includes(currentType);
};
