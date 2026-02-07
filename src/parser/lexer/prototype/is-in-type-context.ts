/**
 * Check Type Context
 *
 * Checks if lexer is currently in a generic type context.
 */

import { Lexer } from '../lexer.js'
import type { ILexerInternal } from '../lexer.types.js'

/**
 * Check if in type context
 *
 * Returns true if currently parsing generic type parameters.
 * Used by parser to determine token interpretation.
 *
 * @returns True if in type context (nesting level > 0)
 */
export function isInTypeContext(this: ILexerInternal): boolean {
  return this._inTypeLevel > 0;
}

// Attach to prototype
Lexer.prototype.isInTypeContext = isInTypeContext;
