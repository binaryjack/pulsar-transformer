/**
 * Handler for '{' and '}' tokens
 * Handles JSX expression boundaries
 */

import type { ILexer } from '../lexer.types.js';
import { TokenTypeEnum } from '../lexer.types.js';
import { JSXStateManager } from './jsx-state-manager.js';

export function handleLeftBrace(lexer: ILexer, char: string): void {
  lexer.addToken(TokenTypeEnum.LBRACE, '{');
  JSXStateManager.enterExpression(lexer);
}

export function handleRightBrace(lexer: ILexer, char: string): void {
  // If we're in a template literal, the } closes the interpolation ${...}
  // It should NOT be emitted as a separate RBRACE token
  if (lexer.templateDepth > 0) {
    // CRITICAL FIX: scanTemplate will handle advancing position internally
    // Do NOT advance here - let scanTemplate manage its own position
    lexer.scanTemplate();
    return;
  }

  // Normal RBRACE token (not in template literal)
  lexer.addToken(TokenTypeEnum.RBRACE, '}');
  JSXStateManager.exitExpression(lexer);
}

export function handleLeftParen(lexer: ILexer, char: string): void {
  lexer.parenthesesDepth++;
  lexer.addToken(TokenTypeEnum.LPAREN, '(');
}

export function handleRightParen(lexer: ILexer, char: string): void {
  lexer.parenthesesDepth--;
  if (lexer.parenthesesDepth < 0) {
    lexer.parenthesesDepth = 0;
  }
  lexer.addToken(TokenTypeEnum.RPAREN, ')');
}

export function handleLeftBracket(lexer: ILexer, char: string): void {
  lexer.addToken(TokenTypeEnum.LBRACKET, '[');
}

export function handleRightBracket(lexer: ILexer, char: string): void {
  lexer.addToken(TokenTypeEnum.RBRACKET, ']');
}
