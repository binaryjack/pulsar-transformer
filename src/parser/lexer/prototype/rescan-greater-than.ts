/**
 * Re-scan Greater Than Token
 *
 * Re-scans to correctly identify `>` as end of type parameter list
 * vs comparison or shift operator.
 * Similar to TypeScript's reScanGreaterToken.
 */

import { TokenType } from '../../lexer/token-types.js';
import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';

/**
 * Re-scan greater than token
 *
 * Called by parser when closing a type parameter/argument list.
 * Validates that `>` is the end of a generic, not a comparison.
 *
 * @returns TokenType.GREATER_THAN if valid, otherwise undefined
 */
export function reScanGreaterThanToken(this: ILexerInternal): TokenType | undefined {
  const currentToken = this._tokens[this._current];

  // Only re-scan if current token is `>`
  if (!currentToken || currentToken.type !== TokenType.GT) {
    return undefined;
  }

  // In type context, `>` closes generic brackets
  if (this._inTypeLevel > 0) {
    return TokenType.GT;
  }

  return undefined;
}

/**
 * Can follow type arguments in expression
 *
 * Checks if what follows `>` is valid for a type argument list.
 * Based on TypeScript's canFollowTypeArgumentsInExpression.
 *
 * Valid followers:
 * - `(` - function call: foo<T>(args)
 * - Template literal - tagged template: foo<T>`string`
 * - `;`, `,`, ` `, newline - end of statement/expression
 *
 * Invalid followers (ambiguous with operators):
 * - `<` - comparison: foo<x<y
 * - `>` - comparison: foo>x>y
 * - `+`, `-` - arithmetic when unary
 */
export function canFollowTypeArguments(this: ILexerInternal): boolean {
  const nextToken = this._tokens[this._current + 1];
  if (!nextToken) {
    return true; // End of input is valid
  }

  switch (nextToken.type) {
    // These can follow type arguments in a call expression
    case TokenType.LPAREN: // foo<T>(args)
    case TokenType.TEMPLATE_LITERAL: // foo<T>`template`
      return true;

    // These indicate end of type argument list
    case TokenType.SEMICOLON:
    case TokenType.COMMA:
    case TokenType.RPAREN:
    case TokenType.RBRACE:
    case TokenType.RBRACKET:
    case TokenType.COLON:
    case TokenType.EOF:
      return true;

    // Ambiguous with operators - disallow
    case TokenType.LT:
    case TokenType.GT:
    case TokenType.PLUS:
    case TokenType.MINUS:
      return false;

    default:
      // For other tokens, allow if it's not the start of an expression
      // that could be interpreted as a binary operator
      return true;
  }
}

// Attach to prototype
Lexer.prototype.reScanGreaterThanToken = reScanGreaterThanToken;
Lexer.prototype.canFollowTypeArguments = canFollowTypeArguments;
