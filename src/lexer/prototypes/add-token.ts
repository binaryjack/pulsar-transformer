/**
 * Lexer.prototype.addToken
 * Creates and adds token to token list
 */

import { Lexer } from '../lexer.js';
import type { ILexer, IToken } from '../lexer.types.js';
import { TokenTypeEnum } from '../lexer.types.js';

Lexer.prototype.addToken = function (this: ILexer, type: TokenTypeEnum, value?: string): void {
  const token: IToken = {
    type,
    value: value ?? '',
    start: this.pos,
    end: this.pos + (value?.length ?? 0),
    line: this.line,
    column: this.column,
  };

  this.tokens.push(token);
};
