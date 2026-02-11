/**
 * Scan JSX text content between tags
 * Handles Unicode, emoji, whitespace correctly
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { TokenTypeEnum, isAlpha } from '../lexer.types.js';

Lexer.prototype.scanJSXText = function (this: ILexer): void {
  const start = this.pos;
  let text = '';

  // Scan until we hit a JSX boundary
  while (!this.isAtEnd()) {
    const ch = this.peek();
    const nextCh = this.peek(1);

    // Stop at opening tag: <div
    if (ch === '<' && isAlpha(nextCh)) {
      // Exit InsideJSXText to allow parsing of nested JSX element
      this.popState();
      break;
    }

    // Stop at closing tag: </div and transition state
    if (ch === '<' && nextCh === '/') {
      // Exit InsideJSXText back to normal parsing for closing tag
      this.popState(); // Remove InsideJSXText
      break;
    }

    // Stop at self-closing: />
    if (ch === '/' && nextCh === '>') {
      break;
    }

    // Stop at expression start: {
    if (ch === '{') {
      // Exit InsideJSXText to allow parsing of JSX expression
      this.popState();
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
    } else if (/^\s+$/.test(text)) {
      // Whitespace-only between expressions: collapse to single space
      // This handles: {expr1} {expr2} -> space preserved
      this.addToken(TokenTypeEnum.JSX_TEXT, ' ');
    }
  }

  // NOTE: Do NOT pop state here - let the caller manage state transitions
  // The JSX text state should persist until we hit a real JSX boundary
};
