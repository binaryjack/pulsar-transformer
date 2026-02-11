/**
 * Lexer.prototype.scanTokens
 * Main entry point - scans all tokens from source
 */

import { Lexer } from '../lexer.js';
import type { ILexer, IToken } from '../lexer.types.js';

Lexer.prototype.scanTokens = function (this: ILexer): IToken[] {
  this.tokens = [];

  // CRITICAL: Infinite loop protection
  const MAX_ITERATIONS = 50000; // Reasonable limit
  let iterations = 0;
  let lastPosition = -1;
  let positionNotAdvancingCount = 0;

  while (!this.isAtEnd()) {
    // Check iteration limit
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      console.error(
        `🚨 LEXER INFINITE LOOP DETECTED - Breaking after ${MAX_ITERATIONS} iterations`
      );
      console.error(`Current position: ${this.pos}, Source length: ${this.source.length}`);
      console.error(
        `Last 10 chars: "${this.source.slice(Math.max(0, this.pos - 5), this.pos + 5)}"`
      );
      break;
    }

    // Check if position is advancing
    const currentPosition = this.pos;
    if (currentPosition === lastPosition) {
      positionNotAdvancingCount++;
      if (positionNotAdvancingCount > 5) {
        console.error(`🚨 LEXER STUCK - Position ${this.pos} not advancing for 5+ iterations`);
        console.error(
          `Character at position: "${this.source[this.pos]}" (code: ${this.source.charCodeAt(this.pos)})`
        );
        // Force advance to break the loop
        this.pos++;
        positionNotAdvancingCount = 0;
      }
    } else {
      positionNotAdvancingCount = 0;
      lastPosition = currentPosition;
    }

    try {
      this.scanToken();
    } catch (error) {
      console.error(`🚨 LEXER ERROR at position ${this.pos}:`, error);
      // Skip problematic character and continue
      this.pos++;
      continue;
    }

    // Safety check to prevent infinite loops
    if (this.tokens.length > 0 && this.tokens[this.tokens.length - 1].type === 'EOF') {
      break;
    }

    // Additional safety: if we have too many tokens, something is wrong
    if (this.tokens.length > MAX_ITERATIONS) {
      console.error(`🚨 TOO MANY TOKENS - Breaking at ${this.tokens.length} tokens`);
      break;
    }
  }

  // Ensure EOF token at end
  if (this.tokens.length === 0 || this.tokens[this.tokens.length - 1].type !== 'EOF') {
    this.addToken('EOF' as any);
  }

  console.log(`✅ Lexer completed: ${this.tokens.length} tokens in ${iterations} iterations`);
  return this.tokens;
};
