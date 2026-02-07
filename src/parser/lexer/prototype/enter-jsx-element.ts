/**
 * Enter JSX Element Context
 *
 * Switches the lexer to JSX text scanning mode.
 * Called by parser when entering JSX element content.
 */

import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';
import { ScanMode } from '../lexer.types.js';

/**
 * Enter JSX element context
 *
 * Switches to JSX_TEXT scanning mode to properly handle text content
 * and distinguish < from less-than operator.
 */
export function enterJSXElement(this: ILexerInternal): void {
  this._inJSXElement = true;
  this._scanMode = ScanMode.JSX_TEXT;
}

// Attach to prototype
Lexer.prototype.enterJSXElement = enterJSXElement;
