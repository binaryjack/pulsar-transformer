/**
 * Handler for '>' token
 * Handles: >, >=, and JSX tag closing state transitions
 */

import type { ILexer } from '../lexer.types.js';
import { LexerStateEnum, TokenTypeEnum } from '../lexer.types.js';
import { JSXStateManager } from './jsx-state-manager.js';

export function handleGreaterThan(lexer: ILexer, char: string): void {
  const state = lexer.getState();

  // PRIORITY 1: Check for bitwise shift >> and >>>
  // Allow in JSXExpression (e.g., {a >> 2}), but NOT in InsideJSX tag
  if (state === LexerStateEnum.Normal || state === LexerStateEnum.InsideJSXExpression) {
    if (lexer.peek() === '>') {
      lexer.advance();

      // Check for >>> or >>>=
      if (lexer.peek() === '>') {
        lexer.advance();
        // Check for >>>=
        if (lexer.peek() === '=') {
          lexer.advance();
          lexer.addToken(TokenTypeEnum.GT_GT_GT_EQUALS, '>>>=');
          return;
        }
        lexer.addToken(TokenTypeEnum.GT_GT_GT, '>>>');
        return;
      }

      // Check for >>=
      if (lexer.peek() === '=') {
        lexer.advance();
        lexer.addToken(TokenTypeEnum.GT_GT_EQUALS, '>>=');
        return;
      }

      lexer.addToken(TokenTypeEnum.GT_GT, '>>');
      return;
    }
  }

  // PRIORITY 2: Check for >=
  if (lexer.match('=')) {
    lexer.addToken(TokenTypeEnum.GT_EQUALS, '>=');
    return;
  }

  lexer.addToken(TokenTypeEnum.GT, '>');

  // Only handle JSX transitions if currently in InsideJSX tag parsing
  // Do NOT transition when in Normal or InsideJSXExpression (comparison operators!)
  const currentState = lexer.getState();
  console.log(
    `[GT-HANDLER] After GT, state=${currentState}, jsxDepth=${lexer.jsxDepth}, nextChar='${lexer.peek()}'`
  );
  if (currentState !== LexerStateEnum.InsideJSX) {
    return;
  }

  // Determine tag type by looking back at recent tokens
  const tagType = determineTagType(lexer);

  switch (tagType) {
    case 'closing':
      // </div>
      JSXStateManager.exitClosingTag(lexer);
      break;

    case 'self-closing':
      // <div />
      JSXStateManager.exitSelfClosingTag(lexer);
      break;

    case 'opening':
      // <div>
      JSXStateManager.exitOpeningTag(lexer);
      break;
  }
}

type TagType = 'opening' | 'closing' | 'self-closing';

function determineTagType(lexer: ILexer): TagType {
  // Look back at recent tokens to determine tag type
  // Token sequence for </div>: LT, SLASH, IDENTIFIER, GT
  // Token sequence for <div />: LT, IDENTIFIER, ..., SLASH, GT
  // Token sequence for <div>: LT, IDENTIFIER, ..., GT

  let foundSlashAfterLT = false;
  let foundSlashBeforeGT = false;

  // Scan backwards (max 10 tokens)
  for (let i = lexer.tokens.length - 2; i >= 0 && i >= lexer.tokens.length - 10; i--) {
    const token = lexer.tokens[i];

    // Find opening LT
    if (token.type === TokenTypeEnum.LT) {
      // Check if next token is SLASH (closing tag)
      if (i + 1 < lexer.tokens.length && lexer.tokens[i + 1].type === TokenTypeEnum.SLASH) {
        foundSlashAfterLT = true;
      }
      break;
    }

    // Check if previous token is SLASH (self-closing)
    if (token.type === TokenTypeEnum.SLASH && i === lexer.tokens.length - 2) {
      foundSlashBeforeGT = true;
    }
  }

  if (foundSlashAfterLT) {
    return 'closing';
  }

  if (foundSlashBeforeGT) {
    return 'self-closing';
  }

  return 'opening';
}
