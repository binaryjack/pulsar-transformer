/**
 * Re-scan Less Than Token
 *
 * Re-scans the current token if it's `<` to determine if it's the start
 * of a type parameter list or just a comparison operator.
 * Similar to TypeScript's reScanLessThanToken and Babel's reScan_lt.
 */

import { TokenType } from '../../lexer/token-types.js';
import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';

/**
 * Re-scan less than token
 *
 * Called by parser when it needs to determine if `<` is the start of
 * a generic type parameter list. Returns the TokenType.LESS_THAN if valid.
 *
 * @returns TokenType.LESS_THAN if valid, otherwise undefined
 */
export function reScanLessThanToken(this: ILexerInternal): TokenType | undefined {
  const currentToken = this._tokens[this._current];

  // Only re-scan if current token is actually `<`
  if (!currentToken || currentToken.type !== TokenType.LT) {
    return undefined;
  }

  // In type context, `<` is always a generic delimiter
  if (this._inTypeLevel > 0) {
    return TokenType.LT;
  }

  // Check if this could be the start of a type parameter list
  // by looking ahead to see if it's followed by type-like tokens
  const nextToken = this._tokens[this._current + 1];
  if (!nextToken) {
    return undefined;
  }

  // Valid start tokens for type parameters:
  // - Identifiers: <T>
  // - const: <const T>
  // - readonly: <readonly T>
  const isTypeStart =
    nextToken.type === TokenType.IDENTIFIER ||
    nextToken.type === TokenType.CONST ||
    nextToken.type === TokenType.READONLY;

  return isTypeStart ? TokenType.LT : undefined;
}

// Attach to prototype
Lexer.prototype.reScanLessThanToken = reScanLessThanToken;
