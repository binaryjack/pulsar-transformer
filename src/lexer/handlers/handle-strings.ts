/**
 * Handler for string literals: " and '
 * CRITICAL: Should NEVER be called when in InsideJSXText state
 */

import type { ILexer } from '../lexer.types.js';

export function handleQuote(lexer: ILexer, char: string): void {
  // Backtrack since scanString expects to be at opening quote
  lexer.pos--;
  lexer.column--;
  lexer.scanString(char);
}

export function handleBacktick(lexer: ILexer, char: string): void {
  // Backtrack since scanTemplate expects to be at opening backtick
  lexer.pos--;
  lexer.column--;
  lexer.scanTemplate();
}
