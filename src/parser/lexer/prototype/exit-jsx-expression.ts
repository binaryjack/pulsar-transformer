/**
 * Exit JSX Expression Context
 *
 * Switches the lexer back to JSX text scanning mode.
 * Called by parser when exiting { } expressions in JSX content.
 */

import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';
import { ScanMode } from '../lexer.types.js';

/**
 * Exit JSX expression context
 *
 * Switches back to JSX_TEXT scanning mode if still in JSX element.
 */
export function exitJSXExpression(this: ILexerInternal): void {
  this._jsxBraceDepth--;
  if (this._jsxBraceDepth === 0) {
    this._inJSXExpression = false;
    if (this._inJSXElement) {
      this._scanMode = ScanMode.JSX_TEXT;
    } else {
      this._scanMode = ScanMode.JAVASCRIPT;
    }
  }
}

// Attach to prototype
Lexer.prototype.exitJSXExpression = exitJSXExpression;
