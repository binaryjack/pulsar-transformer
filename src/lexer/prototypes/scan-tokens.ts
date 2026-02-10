/**
 * Lexer.prototype.scanTokens
 * Main entry point - scans all tokens from source
 */

import { Lexer } from '../lexer.js';
import type { ILexer, IToken } from '../lexer.types.js';

Lexer.prototype.scanTokens = function (this: ILexer): IToken[] {
  this.tokens = [];

  while (!this.isAtEnd()) {
    this.scanToken();

    // Safety check to prevent infinite loops
    if (this.tokens.length > 0 && this.tokens[this.tokens.length - 1].type === 'EOF') {
      break;
    }
  }

  // Ensure EOF token at end
  if (this.tokens.length === 0 || this.tokens[this.tokens.length - 1].type !== 'EOF') {
    this.addToken('EOF' as any);
  }

  return this.tokens;
};
