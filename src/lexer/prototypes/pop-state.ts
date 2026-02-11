/**
 * Pop state from stack and restore previous state
 */

import type { ILexer } from '../lexer.types.js';
import { Lexer } from '../lexer.js';
import { LexerStateEnum } from '../lexer.types.js';

Lexer.prototype.popState = function (this: ILexer): void {
  // Pop previous state
  const previousState = this.stateStack.pop();
  
  // Restore it, or default to Normal
  this.state = previousState !== undefined ? previousState : LexerStateEnum.Normal;
};
