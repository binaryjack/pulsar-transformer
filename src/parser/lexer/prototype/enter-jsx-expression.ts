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
 */
export function enterJSXExpression(this: ILexerInternal): void {
  this._jsxBraceDepth++;
  this._inJSXExpression = true;
  this._scanMode = ScanMode.JAVASCRIPT;
}

// Attach to prototype
Lexer.prototype.enterJSXExpression = enterJSXExpression;
