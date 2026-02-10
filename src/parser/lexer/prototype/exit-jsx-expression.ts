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
 * Properly handles template literals that span JSX expression boundaries.
 */
export function exitJSXExpression(this: ILexerInternal): void {
  this._jsxBraceDepth--;

  // Check if we have any template literals whose context matches the current depth
  // This handles the case where a template literal expression spans into JSX
  // Example: <div style={`color: ${isActive ? 'blue' : 'red'}`}>
  const hasActiveTemplate =
    this._templateLiteralStack &&
    this._templateLiteralStack.length > 0 &&
    this._templateLiteralStack.some((state) => state.jsxBraceDepth === this._jsxBraceDepth + 1);

  if (this._jsxBraceDepth === 0) {
    this._inJSXExpression = false;
    if (this._inJSXElement && !hasActiveTemplate) {
      // Only switch to JSX_TEXT if we're not in the middle of a template literal
      this._scanMode = ScanMode.JSX_TEXT;
    } else {
      // Stay in JAVASCRIPT mode if we have an active template literal
      this._scanMode = ScanMode.JAVASCRIPT;
    }
  }
}

// Attach to prototype
Lexer.prototype.exitJSXExpression = exitJSXExpression;
