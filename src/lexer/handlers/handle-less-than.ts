/**
 * Handler for '<' token
 * Handles: <, <=, </tag, <tag, generics <T>
 */

import type { ILexer } from '../lexer.types.js';
import { LexerStateEnum, TokenTypeEnum, isAlpha } from '../lexer.types.js';
import { JSXStateManager } from './jsx-state-manager.js';

export function handleLessThan(lexer: ILexer, char: string): void {
  const state = lexer.getState();

  // PRIORITY 1: Check for bitwise shift << and <<=
  // Allow in JSXExpression (e.g., {a << 2}), but NOT in InsideJSX tag
  if (state === LexerStateEnum.Normal || state === LexerStateEnum.InsideJSXExpression) {
    if (lexer.peek() === '<') {
      lexer.advance();
      // Check for <<=
      if (lexer.peek() === '=') {
        lexer.advance();
        lexer.addToken(TokenTypeEnum.LT_LT_EQUALS, '<<=');
        return;
      }
      lexer.addToken(TokenTypeEnum.LT_LT, '<<');
      return;
    }
  }

  // PRIORITY 2: Check for <=
  if (lexer.match('=')) {
    lexer.addToken(TokenTypeEnum.LT_EQUALS, '<=');
    return;
  }

  // PRIORITY 3: Check for JSX fragment: <>
  if (lexer.peek() === '>') {
    lexer.advance();
    lexer.addToken(TokenTypeEnum.JSX_FRAGMENT_OPEN, '<>');
    JSXStateManager.enterOpeningTag(lexer);
    // Immediately exit to InsideJSXText (fragments don't have attributes)
    JSXStateManager.exitOpeningTag(lexer);
    return;
  }

  // PRIORITY 4: Check for JSX closing tag: </
  if (lexer.match('/')) {
    // Check for fragment close: </>
    if (lexer.peek() === '>') {
      lexer.advance();
      lexer.addToken(TokenTypeEnum.JSX_FRAGMENT_CLOSE, '</>');

      // Exit JSX context
      if (lexer.jsxDepth > 0 || lexer.getState() === LexerStateEnum.InsideJSX) {
        JSXStateManager.exitClosingTag(lexer);
      }
      return;
    }

    // Regular closing tag: </div
    lexer.addToken(TokenTypeEnum.LT, '<');
    lexer.addToken(TokenTypeEnum.SLASH, '/');

    // CRITICAL: Only enter JSX closing tag if we're actually in JSX context
    // This prevents: expressions like (a < /regex/) from breaking jsxDepth tracking
    if (lexer.jsxDepth > 0 || lexer.getState() === LexerStateEnum.InsideJSX) {
      JSXStateManager.enterClosingTag(lexer);
    }
    return;
  }

  const nextCh = lexer.peek();

  // PRIORITY 5: Check for generic type parameter: <T> or <boolean>
  if (isAlpha(nextCh)) {
    let lookAhead = nextCh;
    let i = 1;
    while (i < 30 && lexer.pos + i < lexer.source.length) {
      const ch = lexer.source[lexer.pos + i];
      lookAhead += ch;
      if (ch === '>' || ch === ',' || ch === '=' || ch === '\n') {
        break;
      }
      i++;
    }

    // Check for TypeScript generic patterns:
    // 1. Uppercase types: <T>, <MyType>
    // 2. Built-in types: <boolean>, <string>, <number>
    // 3. Complex types: <T extends U>, <boolean | null>
    const isGenericPattern =
      lookAhead.match(/^[A-Z][a-zA-Z0-9]*\s*(>|,|extends|=)/) ||
      lookAhead.match(
        /^(boolean|string|number|void|null|undefined|any|unknown|never|bigint|symbol|object)\s*(>|,|\|)/
      );

    if (isGenericPattern) {
      lexer.addToken(TokenTypeEnum.LT, '<');
      return;
    }
  }

  // Check if this could be JSX tag opening
  if (isAlpha(nextCh)) {
    const state = lexer.getState();

    // CRITICAL: In JSXExpression, < can be either:
    // 1. Comparison operator: {count < 10}
    // 2. JSX element: {isLoggedIn && <UserProfile />}
    //
    // We detect JSX by checking if the identifier starts with uppercase (component)
    // OR if we're NOT in a comparison context (after identifier/number/paren)
    if (state === LexerStateEnum.InsideJSXExpression) {
      const isUpperCase = nextCh === nextCh.toUpperCase();
      const prevToken = lexer.tokens[lexer.tokens.length - 1];

      // After identifier, number, or ) -> likely comparison: x < y, count() < 10
      const likelyComparison =
        prevToken &&
        (prevToken.type === TokenTypeEnum.IDENTIFIER ||
          prevToken.type === TokenTypeEnum.NUMBER ||
          prevToken.type === TokenTypeEnum.RPAREN);

      // If lowercase tag AND looks like comparison, treat as operator
      if (!isUpperCase && likelyComparison) {
        lexer.addToken(TokenTypeEnum.LT, '<');
        return;
      }

      // Otherwise it's JSX (uppercase component or after &&/||/?)
      // Fall through to JSX handling below
    }

    // JSX opening tag: <div or <Component
    lexer.addToken(TokenTypeEnum.LT, '<');
    JSXStateManager.enterOpeningTag(lexer);
    return;
  }

  // Default: less-than operator
  lexer.addToken(TokenTypeEnum.LT, '<');
}
