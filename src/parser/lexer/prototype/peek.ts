/**
 * Lexer peek method
 *
 * Look ahead at next token without consuming it.
 */

import type { ILexerInternal } from '../lexer.types.js';
import type { IToken } from '../token-types.js';

/**
 * Peek at current token without consuming
 *
 * @returns Current token or null if EOF
 */
export function peek(this: ILexerInternal): IToken | null {
  if (this._current >= this._tokens.length) {
    return null;
  }

  return this._tokens[this._current];
}
