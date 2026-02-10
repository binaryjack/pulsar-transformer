/**
 * Parser.prototype.expect
 * Consume token if it matches expected type, throw error otherwise
 */

import type { IToken } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

Parser.prototype.expect = function (this: IParser, type: string, message?: string): IToken {
  const token = this.peek();

  if (token.type !== type) {
    const errorMsg =
      message ||
      `Expected token type '${type}', got '${token.type}' at line ${token.line}, column ${token.column}`;
    throw new Error(errorMsg);
  }

  return this.advance();
};
