/**
 * Exit JSX Element Context
 *
 * Switches the lexer back to JavaScript scanning mode.
 * Called by parser when exiting JSX element content.
 */

import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';
import { ScanMode } from '../lexer.types.js';

/**
 * Exit JSX element context
 *
 * Switches back to JAVASCRIPT scanning mode.
 */
export function exitJSXElement(this: ILexerInternal): void {
  this._inJSXElement = false;
  if (this._jsxBraceDepth === 0) {
    this._scanMode = ScanMode.JAVASCRIPT;
  }
}

// Attach to prototype
Lexer.prototype.exitJSXElement = exitJSXElement;
