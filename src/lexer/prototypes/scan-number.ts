/**
 * Lexer.prototype.scanNumber
 * Scans number literal (integer or float) with numeric separator support
 * Also handles BigInt literals (123n)
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { isDigit, TokenTypeEnum } from '../lexer.types.js';

Lexer.prototype.scanNumber = function (this: ILexer): void {
  const start = this.pos;
  let hasDecimal = false;
  let lastChar = '';

  // Scan integer part with optional underscores
  while (!this.isAtEnd()) {
    const ch = this.peek();
    
    if (isDigit(ch)) {
      lastChar = ch;
      this.advance();
    } else if (ch === '_') {
      // Numeric separator validation
      if (lastChar === '' || lastChar === '_') {
        throw new Error(`Invalid numeric separator at line ${this.line}, column ${this.column}: cannot start with or have consecutive underscores`);
      }
      lastChar = ch;
      this.advance();
    } else {
      break;
    }
  }

  // Validate: cannot end with underscore
  if (lastChar === '_') {
    throw new Error(`Invalid numeric separator at line ${this.line}, column ${this.column}: cannot end with underscore`);
  }

  // Check for decimal point
  if (!this.isAtEnd() && this.peek() === '.' && isDigit(this.peek(1))) {
    hasDecimal = true;
    lastChar = '.';
    // Consume '.'
    this.advance();

    // Scan fractional part with optional underscores
    while (!this.isAtEnd()) {
      const ch = this.peek();
      
      if (isDigit(ch)) {
        lastChar = ch;
        this.advance();
      } else if (ch === '_') {
        // Numeric separator validation
        if (lastChar === '.' || lastChar === '_') {
          throw new Error(`Invalid numeric separator at line ${this.line}, column ${this.column}: cannot follow decimal point or be consecutive`);
        }
        lastChar = ch;
        this.advance();
      } else {
        break;
      }
    }

    // Validate: cannot end with underscore
    if (lastChar === '_') {
      throw new Error(`Invalid numeric separator at line ${this.line}, column ${this.column}: cannot end with underscore`);
    }
  }

  // Check for BigInt suffix 'n'
  if (!this.isAtEnd() && this.peek() === 'n') {
    if (hasDecimal) {
      throw new Error(`Invalid BigInt literal at line ${this.line}, column ${this.column}: cannot have decimal point`);
    }
    this.advance();
    
    // Strip underscores from value for BigInt
    let value = this.source.substring(start, this.pos);
    value = value.replace(/_/g, ''); // Remove all underscores
    
    this.addToken(TokenTypeEnum.BIGINT, value);
    return;
  }

  // Regular number - strip underscores from value
  let value = this.source.substring(start, this.pos);
  value = value.replace(/_/g, ''); // Remove all underscores
  
  this.addToken(TokenTypeEnum.NUMBER, value);
};
