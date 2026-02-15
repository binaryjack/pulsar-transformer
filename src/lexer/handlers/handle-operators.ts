/**
 * Handlers for arithmetic and logical operators
 */

import type { ILexer } from '../lexer.types.js';
import { TokenTypeEnum } from '../lexer.types.js';

export function handlePlus(lexer: ILexer, char: string): void {
  if (lexer.peek() === '+') {
    lexer.advance();
    lexer.addToken(TokenTypeEnum.PLUS_PLUS, '++');
  } else {
    lexer.addToken(TokenTypeEnum.PLUS, '+');
  }
}

export function handleMinus(lexer: ILexer, char: string): void {
  if (lexer.peek() === '-') {
    lexer.advance();
    lexer.addToken(TokenTypeEnum.MINUS_MINUS, '--');
  } else {
    lexer.addToken(TokenTypeEnum.MINUS, '-');
  }
}

export function handleStar(lexer: ILexer, char: string): void {
  if (lexer.peek() === '*') {
    lexer.advance();
    // Check for **=
    if (lexer.peek() === '=') {
      lexer.advance();
      lexer.addToken(TokenTypeEnum.STAR_STAR_EQUALS, '**=');
    } else {
      lexer.addToken(TokenTypeEnum.EXPONENTIATION, '**');
    }
  } else {
    lexer.addToken(TokenTypeEnum.STAR, '*');
  }
}

export function handlePercent(lexer: ILexer, char: string): void {
  lexer.addToken(TokenTypeEnum.PERCENT, '%');
}

export function handleEquals(lexer: ILexer, char: string): void {
  if (lexer.match('=')) {
    if (lexer.match('=')) {
      lexer.addToken(TokenTypeEnum.EQUALS_EQUALS_EQUALS, '===');
    } else {
      lexer.addToken(TokenTypeEnum.EQUALS_EQUALS, '==');
    }
  } else if (lexer.match('>')) {
    lexer.addToken(TokenTypeEnum.ARROW, '=>');
  } else {
    lexer.addToken(TokenTypeEnum.EQUALS, '=');
  }
}

export function handleExclamation(lexer: ILexer, char: string): void {
  if (lexer.match('=')) {
    if (lexer.match('=')) {
      lexer.addToken(TokenTypeEnum.NOT_EQUALS_EQUALS, '!==');
    } else {
      lexer.addToken(TokenTypeEnum.NOT_EQUALS, '!=');
    }
  } else {
    lexer.addToken(TokenTypeEnum.EXCLAMATION, '!');
  }
}

export function handleAmpersand(lexer: ILexer, char: string): void {
  if (lexer.match('&')) {
    // Check for &&=
    if (lexer.peek() === '=') {
      lexer.advance();
      lexer.addToken(TokenTypeEnum.AMPERSAND_AMPERSAND_EQUALS, '&&=');
    } else {
      lexer.addToken(TokenTypeEnum.AMPERSAND_AMPERSAND, '&&');
    }
  } else {
    lexer.addToken(TokenTypeEnum.AMPERSAND, '&');
  }
}

export function handlePipe(lexer: ILexer, char: string): void {
  if (lexer.match('|')) {
    // Check for ||=
    if (lexer.peek() === '=') {
      lexer.advance();
      lexer.addToken(TokenTypeEnum.PIPE_PIPE_EQUALS, '||=');
    } else {
      lexer.addToken(TokenTypeEnum.PIPE_PIPE, '||');
    }
  } else {
    lexer.addToken(TokenTypeEnum.PIPE, '|');
  }
}

export function handleQuestion(lexer: ILexer, char: string): void {
  if (lexer.match('?')) {
    // Check for ??=
    if (lexer.peek() === '=') {
      lexer.advance();
      lexer.addToken(TokenTypeEnum.QUESTION_QUESTION_EQUALS, '??=');
    } else {
      lexer.addToken(TokenTypeEnum.QUESTION_QUESTION, '??');
    }
  } else if (lexer.match('.')) {
    // Optional chaining: ?.
    // But NOT if followed by digit (to avoid 3.14 confusion)
    const next = lexer.peek();
    if (next >= '0' && next <= '9') {
      // Revert: it's ? followed by .14
      lexer.pos--;
      lexer.column--;
      lexer.addToken(TokenTypeEnum.QUESTION, '?');
    } else {
      lexer.addToken(TokenTypeEnum.QUESTION_DOT, '?.');
    }
  } else {
    lexer.addToken(TokenTypeEnum.QUESTION, '?');
  }
}

export function handleDot(lexer: ILexer, char: string): void {
  if (lexer.match('.')) {
    if (lexer.match('.')) {
      lexer.addToken(TokenTypeEnum.SPREAD, '...');
    } else {
      // Two dots: add two DOT tokens
      lexer.addToken(TokenTypeEnum.DOT, '.');
      lexer.addToken(TokenTypeEnum.DOT, '.');
    }
  } else {
    lexer.addToken(TokenTypeEnum.DOT, '.');
  }
}

export function handleSlash(lexer: ILexer, char: string): void {
  // Backtrack and call scanRegex - it will determine if regex or comment/division
  lexer.pos--;
  lexer.column--;
  lexer.advance();

  // Check if it's a comment first
  const next = lexer.peek();
  if (next === '/' || next === '*') {
    lexer.scanComment();
  } else {
    // Could be regex or division - scanRegex will decide
    lexer.scanRegex();
  }
}

export function handleSemicolon(lexer: ILexer, char: string): void {
  lexer.addToken(TokenTypeEnum.SEMICOLON, ';');
}

export function handleComma(lexer: ILexer, char: string): void {
  lexer.addToken(TokenTypeEnum.COMMA, ',');
}

export function handleColon(lexer: ILexer, char: string): void {
  lexer.addToken(TokenTypeEnum.COLON, ':');
}
