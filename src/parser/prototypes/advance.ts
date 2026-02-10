/**
 * Parser.prototype.advance
 * Consume current token and move to next
 */

import type { IToken } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

Parser.prototype.advance = function (this: IParser): IToken {
  const token = this.peek();

  if (!this.isAtEnd()) {
    this.current++;
  }

  return token;
};
