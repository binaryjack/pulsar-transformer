/**
 * Parser.prototype.isAtEnd
 * Check if reached end of token stream
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

Parser.prototype.isAtEnd = function (this: IParser): boolean {
  return this.peek().type === TokenTypeEnum.EOF;
};
