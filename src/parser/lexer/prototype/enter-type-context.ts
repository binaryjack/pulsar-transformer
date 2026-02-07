/**
 * Enter Type Context
 *
 * Marks entry into a generic type context.
 * Called by parser when entering type parameter lists or type expressions.
 */

import { Lexer } from '../lexer.js'
import type { ILexerInternal } from '../lexer.types.js'

/**
 * Enter type context
 *
 * Increments the type context nesting level.
 * In type context, < and > are treated as generic type delimiters
 * rather than comparison operators or shift operators.
 */
export function enterTypeContext(this: ILexerInternal): void {
  this._inTypeLevel++;
}

// Attach to prototype
Lexer.prototype.enterTypeContext = enterTypeContext;
