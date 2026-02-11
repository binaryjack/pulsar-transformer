/**
 * Scan JSX text content between tags
 * Handles Unicode, emoji, whitespace correctly
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { LexerStateEnum, TokenTypeEnum, isAlpha } from '../lexer.types.js';

Lexer.prototype.scanJSXText = function (this: ILexer): void {
  const start = this.pos;
  let text = '';

  // Scan until we hit a JSX boundary
  while (!this.isAtEnd()) {
    const ch = this.peek();
    const nextCh = this.peek(1);

    // Stop at opening tag: <div
    if (ch === '<' && isAlpha(nextCh)) {
      break;
    }

    // Stop at closing tag: </div
    if (ch === '<' && nextCh === '/') {
      break;
    }

    // Stop at self-closing: />
    if (ch === '/' && nextCh === '>') {
      break;
    }

    // Stop at expression start: {
    if (ch === '{') {
      break;
    }

    // Accumulate text (including Unicode/emoji)
    text += ch;
    this.advance();
  }

  // Only add token if we have non-empty text
  if (text.length > 0) {
    // For JSX, we need to preserve whitespace between expressions
    // Example: <div>{a} {b}</div> should have a space between a and b
    // But trim leading/trailing newlines/spaces at element boundaries
    const trimmed = text.trim();

    if (trimmed.length > 0) {
      // Has actual content - use trimmed version
      this.addToken(TokenTypeEnum.JSX_TEXT, trimmed);
    } else if (text.match(/^\s+$/)) {
      // Whitespace-only between expressions: collapse to single space
      // This handles: {expr1} {expr2} -> space preserved
      this.addToken(TokenTypeEnum.JSX_TEXT, ' ');
    }
  }

  // Transition out of JSX text if we hit a boundary
  // The next scanToken will handle the boundary token
  if (this.getState() === LexerStateEnum.InsideJSXText) {
    this.popState(); // Exit InsideJSXText
  }
};
