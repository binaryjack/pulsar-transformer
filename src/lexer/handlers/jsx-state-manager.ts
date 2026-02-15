/**
 * JSX State Transition Manager
 * Handles complex state stack management for JSX contexts
 *
 * CRITICAL: This fixes the state corruption bug that causes
 * "don't" to be treated as a string literal.
 */

import type { ILexer } from '../lexer.types.js';
import { LexerStateEnum } from '../lexer.types.js';

export class JSXStateManager {
  /**
   * Called when entering a JSX opening tag: <div
   * BEFORE processing tag name and attributes
   */
  static enterOpeningTag(lexer: ILexer): void {
    lexer.jsxDepth++;

    const currentState = lexer.getState();

    // Push InsideJSX to parse tag name and attributes
    // Can be called from Normal, InsideJSXText, or InsideJSXExpression states
    if (
      currentState === LexerStateEnum.Normal ||
      currentState === LexerStateEnum.InsideJSXText ||
      currentState === LexerStateEnum.InsideJSXExpression
    ) {
      lexer.pushState(LexerStateEnum.InsideJSX);
    }
  }

  /**
   * Called when finishing a JSX opening tag: >
   * AFTER tag name and attributes, transitioning to content
   */
  static exitOpeningTag(lexer: ILexer): void {
    // Pop InsideJSX state
    lexer.popState();

    // ALWAYS push InsideJSXText if still inside a JSX element
    // This is CRITICAL: ensures "don't" is treated as text, not string
    if (lexer.jsxDepth > 0) {
      lexer.pushState(LexerStateEnum.InsideJSXText);
    }
  }

  /**
   * Called when entering a JSX closing tag: </div
   */
  static enterClosingTag(lexer: ILexer): void {
    // Push InsideJSX to parse closing tag name
    lexer.pushState(LexerStateEnum.InsideJSX);
  }

  /**
   * Called when finishing a JSX closing tag: >
   */
  static exitClosingTag(lexer: ILexer): void {
    // Decrement depth
    lexer.jsxDepth--;

    // Pop InsideJSX state
    lexer.popState();

    // CRITICAL: When jsxDepth reaches 0, we've COMPLETELY exited JSX
    // Must pop ALL JSX-related states back to Normal
    if (lexer.jsxDepth === 0) {
      lexer.expressionDepth = 0;
      lexer.parenthesesDepth = 0;

      // Pop any remaining JSX states (InsideJSXText, InsideJSXExpression, etc.)
      while (lexer.getState() !== LexerStateEnum.Normal && lexer.stateStack.length > 0) {
        lexer.popState();
      }
    }

    // If still nested inside JSX, restore InsideJSXText
    // This handles: <div><p>text</p>MORE TEXT</div>
    //                                 ^^^^^^^^^ needs InsideJSXText
    if (lexer.jsxDepth > 0) {
      const currentState = lexer.getState();
      if (
        currentState !== LexerStateEnum.InsideJSXText &&
        currentState !== LexerStateEnum.InsideJSXExpression
      ) {
        lexer.pushState(LexerStateEnum.InsideJSXText);
      }
    }
  }

  /**
   * Called when finishing a self-closing tag: />
   */
  static exitSelfClosingTag(lexer: ILexer): void {
    // Decrement depth
    lexer.jsxDepth--;

    // Pop InsideJSX state
    lexer.popState();

    // CRITICAL: When jsxDepth reaches 0, we've COMPLETELY exited JSX
    // Must pop ALL JSX-related states back to Normal
    if (lexer.jsxDepth === 0) {
      lexer.expressionDepth = 0;
      lexer.parenthesesDepth = 0;

      // Pop any remaining JSX states (InsideJSXText, InsideJSXExpression, etc.)
      while (lexer.getState() !== LexerStateEnum.Normal && lexer.stateStack.length > 0) {
        lexer.popState();
      }
    }

    // If still nested inside JSX, restore InsideJSXText
    if (lexer.jsxDepth > 0) {
      const currentState = lexer.getState();
      if (
        currentState !== LexerStateEnum.InsideJSXText &&
        currentState !== LexerStateEnum.InsideJSXExpression
      ) {
        lexer.pushState(LexerStateEnum.InsideJSXText);
      }
    }
  }

  /**
   * Called when entering JSX expression: {
   */
  static enterExpression(lexer: ILexer): void {
    lexer.expressionDepth++;

    const currentState = lexer.getState();

    // Enter JSX expression mode if in JSX context
    if (
      currentState === LexerStateEnum.InsideJSX ||
      currentState === LexerStateEnum.InsideJSXText ||
      lexer.justExitedJSXTextForBrace
    ) {
      lexer.pushState(LexerStateEnum.InsideJSXExpression);
    }

    // Clear flag
    lexer.justExitedJSXTextForBrace = false;
  }

  /**
   * Called when exiting JSX expression: }
   */
  static exitExpression(lexer: ILexer): void {
    lexer.expressionDepth--;

    // Safety
    if (lexer.expressionDepth < 0) {
      lexer.expressionDepth = 0;
    }

    // Only pop if at depth 0 and in JSX expression
    if (lexer.expressionDepth === 0 && lexer.getState() === LexerStateEnum.InsideJSXExpression) {
      lexer.popState();

      // Restore InsideJSXText if needed
      const afterPop = lexer.getState();
      if (
        lexer.jsxDepth > 0 &&
        afterPop !== LexerStateEnum.InsideJSXText &&
        afterPop !== LexerStateEnum.InsideJSX
      ) {
        lexer.pushState(LexerStateEnum.InsideJSXText);
      }
    }
  }
}
