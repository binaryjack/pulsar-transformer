/**
 * Scan JSX text content between tags
 * Handles Unicode, emoji, whitespace correctly
 */

import type { ILexer } from '../lexer.types.js';
import { Lexer } from '../lexer.js';
import { TokenTypeEnum, LexerStateEnum, isAlpha } from '../lexer.types.js';

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
    // Trim whitespace but preserve internal spaces
    const trimmed = text.trim();
    
    if (trimmed.length > 0) {
      this.addToken(TokenTypeEnum.JSX_TEXT, trimmed);
    }
  }
  
  // Transition out of JSX text if we hit a boundary
  // The next scanToken will handle the boundary token
  if (this.getState() === LexerStateEnum.InsideJSXText) {
    this.popState(); // Exit InsideJSXText
  }
};
