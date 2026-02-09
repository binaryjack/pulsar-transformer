/**
 * Enter JSX Expression Context
 *
 * Switches the lexer to JavaScript scanning mode inside JSX expressions.
 * Called by parser when entering { } expressions in JSX content.
 */

import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';
import { ScanMode } from '../lexer.types.js';

/**
 * Enter JSX expression context
 *
 * Switches to JAVASCRIPT scanning mode to parse expressions inside { }.
 * Template literal state is preserved via jsxBraceDepth tracking in stack.
 */
export function enterJSXExpression(this: ILexerInternal): void {
  this._jsxBraceDepth++;
  this._inJSXExpression = true;
  this._scanMode = ScanMode.JAVASCRIPT;

  // Template literal state is automatically preserved because we track
  // jsxBraceDepth in each template stack entry. When we push a new template
  // state, it captures the current jsxBraceDepth, allowing proper restoration
  // when exiting JSX expressions that contain template literals.
}

// Attach to prototype
Lexer.prototype.enterJSXExpression = enterJSXExpression;
