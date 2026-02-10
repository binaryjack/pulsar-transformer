/**
 * Parser.prototype.peek
 * Look ahead at token without consuming
 */

import type { IToken } from '../../lexer/lexer.types.js';
import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

Parser.prototype.peek = function (this: IParser, offset: number = 0): IToken {
  const index = this.current + offset;

  if (index >= this.tokens.length) {
    // Return EOF token
    return (
      this.tokens[this.tokens.length - 1] || {
        type: TokenTypeEnum.EOF,
        value: '',
        start: 0,
        end: 0,
        line: 0,
        column: 0,
      }
    );
  }

  return this.tokens[index];
};
