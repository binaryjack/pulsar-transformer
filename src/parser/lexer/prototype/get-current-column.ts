/**
 * Get current column position
 *
 * Calculates column from position and lineStart (Babel pattern).
 * Column is CALCULATED, not incremented, to prevent accumulation.
 */

import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';

/**
 * Calculate current column position
 *
 * Following Babel's pattern: column = position - lineStart
 * This ensures column resets properly on newlines.
 *
 * @returns Column number (1-based)
 */
export function _getCurrentColumn(this: ILexerInternal): number {
  return this._position - this._lineStart + 1; // 1-based column
}

// Attach to prototype
Lexer.prototype._getCurrentColumn = _getCurrentColumn;
