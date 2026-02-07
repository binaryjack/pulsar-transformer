/**
 * Exit Type Context
 *
 * Marks exit from a generic type context.
 * Called by parser when exiting type parameter lists or type expressions.
 */

import { Lexer } from '../lexer.js'
import type { ILexerInternal } from '../lexer.types.js'

/**
 * Exit type context
 *
 * Decrements the type context nesting level.
 * Throws an error if attempting to exit when not in a type context.
 */
export function exitTypeContext(this: ILexerInternal): void {
  if (this._inTypeLevel === 0) {
    throw new Error('Cannot exit type context: not currently in type context');
  }
  this._inTypeLevel--;
}

// Attach to prototype
Lexer.prototype.exitTypeContext = exitTypeContext;
