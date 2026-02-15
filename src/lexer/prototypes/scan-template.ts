/**
 * Lexer.prototype.scanTemplate
 * Scans template literal with backticks, handling ${} expressions
 * Properly emits TEMPLATE_HEAD, TEMPLATE_MIDDLE, TEMPLATE_TAIL
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { TokenTypeEnum } from '../lexer.types.js';

/**
 * Scan template literal part
 * Called when:
 * 1. Initial ` (backtick) via handleBacktick - pos is AT the backtick
 * 2. After } in template via handleRightBrace - pos is AFTER the }
 */
Lexer.prototype.scanTemplate = function (this: ILexer): void {
  console.log(
    `[TEMPLATE-DEBUG] scanTemplate called, pos=${this.pos}, char='${this.peek()}', templateDepth=${this.templateDepth}`
  );

  // handleBacktick backtracks, so peek() === '`' means fresh start
  // Otherwise we're continuing after } and pos is already at next content
  const isStart = this.peek(-1) !== '}';
  console.log(`[TEMPLATE-DEBUG] isStart=${isStart}, prevChar='${this.peek(-1)}'`);

  if (isStart && this.peek() === '`') {
    // Fresh start: skip opening backtick
    this.advance();
    this.templateDepth++;
    console.log(`[TEMPLATE-DEBUG] Started new template, depth now ${this.templateDepth}`);
  }

  let value = '';

  // Scan until ${ or closing `
  while (!this.isAtEnd()) {
    const ch = this.peek();

    // Check for interpolation start: ${
    if (ch === '$' && this.peek(1) === '{') {
      // Emit TEMPLATE_HEAD (first ${) or TEMPLATE_MIDDLE (after })
      const tokenType = isStart ? TokenTypeEnum.TEMPLATE_HEAD : TokenTypeEnum.TEMPLATE_MIDDLE;

      this.addToken(tokenType, value);

      // Consume ${ - they're structural markers
      this.advance(); // $
      this.advance(); // {

      // Expression will be lexed normally
      // When } is hit, handleRightBrace will call us again
      return;
    }

    // Check for closing backtick
    if (ch === '`') {
      // Simple template (no ${) or final part after last }
      const tokenType =
        isStart && this.templateDepth === 0
          ? TokenTypeEnum.TEMPLATE_LITERAL
          : TokenTypeEnum.TEMPLATE_TAIL;

      this.addToken(tokenType, value);
      this.advance(); // consume `
      this.templateDepth--;
      return;
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
          case '`':
            value += '`';
            break;
          case '$':
            value += '$';
            break;
          default:
            value += escaped;
        }
        this.advance();
      }
      continue;
    }

    // Regular character
    value += ch;
    this.advance();
  }

  throw new Error(`Unterminated template literal at line ${this.line}, column ${this.column}`);
};
