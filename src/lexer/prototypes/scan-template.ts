/**
 * Lexer.prototype.scanTemplate
 * Scans template literal with backticks, handling ${} expressions
 * Follows ESTree specification for TemplateLiteral
 *
 * Simplified implementation: Scans the entire template literal content,
 * then let the parser handle splitting it into parts and expressions.
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { TokenTypeEnum } from '../lexer.types.js';

/**
 * Scan template literal: `simple` or `hello ${name}`
 *
 * For now, emits TEMPLATE_LITERAL with the raw content.
 * The parser will handle splitting into quasis and expressions.
 */
Lexer.prototype.scanTemplate = function (this: ILexer): void {
  const start = this.pos;

  // Skip opening backtick
  this.advance();

  let value = '';
  let raw = '';

  // Scan until closing backtick
  while (!this.isAtEnd() && this.peek() !== '`') {
    const ch = this.peek();

    // Handle escape sequences
    if (ch === '\\') {
      raw += ch;
      this.advance();

      if (!this.isAtEnd()) {
        const escaped = this.peek();
        raw += escaped;

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
          case '`':
            value += '`';
            break;
          case '$':
            // Escaped dollar sign: \$ → $
            value += '$';
            break;
          default:
            value += escaped;
        }
        this.advance();
      }
      continue;
    }

    // Regular character (including $ and {)
    raw += ch;
    value += ch;
    this.advance();
  }

  // Consume closing backtick
  if (!this.isAtEnd() && this.peek() === '`') {
    this.advance();
  } else {
    throw new Error(`Unterminated template literal at line ${this.line}, column ${this.column}`);
  }

  // Emit TEMPLATE_LITERAL with the content
  // Store both value and raw for the parser to use
  this.addToken(TokenTypeEnum.TEMPLATE_LITERAL, value);
};
