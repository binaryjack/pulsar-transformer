/**
 * Lexer.prototype.scanString
 * Scans string literal with quotes
 */

import { Lexer } from '../lexer.js'
import type { ILexer } from '../lexer.types.js'
import { TokenTypeEnum } from '../lexer.types.js'

Lexer.prototype.scanString = function (this: ILexer, quote: string): void {
  const start = this.pos;

  // Skip opening quote
  this.advance();

  let value = '';

  while (!this.isAtEnd() && this.peek() !== quote) {
    const ch = this.peek();

    // JavaScript doesn't allow unescaped newlines in strings
    // Provide helpful error message
    if (ch === '\n' || ch === '\r') {
      throw new Error(
        `Unterminated string literal at line ${this.line}, column ${this.column}. ` +
        `JavaScript/TypeScript doesn't allow unescaped newlines in strings. ` +
        `Use template literals (\`...\`) for multi-line strings or escape newlines (\\n).`
      );
    }

    // Handle escape sequences
    if (ch === '\\') {
      this.advance();
      if (!this.isAtEnd()) {
        const escaped = this.peek();
        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '\\':
            value += '\\';
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            value += escaped;
        }
        this.advance();
      }
    } else {
      value += ch;
      this.advance();
    }
  }

  // Consume closing quote
  if (!this.isAtEnd() && this.peek() === quote) {
    this.advance();
  } else {
    // Unterminated string - add error handling later
    throw new Error(`Unterminated string at line ${this.line}, column ${this.column}`);
  }

  this.addToken(TokenTypeEnum.STRING, value);
};
