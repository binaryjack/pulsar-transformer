/**
 * Scan JSX Text Content
 *
 * Scans text content inside JSX elements until reaching < or {.
 * This is the JSX text scanning mode that distinguishes JSX text from operators.
 */

import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';
import type { IToken } from '../token-types.js';
import { TokenType } from '../token-types.js';

/**
 * Scan JSX text content
 *
 * Reads text until encountering:
 * - < (start of tag or closing tag)
 * - { (start of expression)
 * - End of source
 *
 * @param start - Start position in source
 * @param line - Start line number
 * @param column - Start column number
 * @returns JSX_TEXT token or null if no text content
 */
export function _scanJSXText(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number
): IToken | null {
  let value = '';

  while (this._position < this._source.length) {
    const char = this._source[this._position];

    // Stop at < or {
    if (char === '<' || char === '{') {
      break;
    }

    // Track newlines (Babel pattern)
    if (char === '\n' || char === '\r') {
      value += char;
      this._position++;
      this._line++;
      this._lineStart = this._position; // Track line start position
      continue;
    }

    // Collect text content
    value += char;
    this._position++;
    // Column is calculated, not incremented
  }

  // Return null if no text was collected
  if (value.length === 0) {
    return null;
  }

  return {
    type: TokenType.JSX_TEXT,
    value,
    line,
    column,
    start,
    end: this._position,
  };
}

// Attach to prototype
Lexer.prototype._scanJSXText = _scanJSXText;
