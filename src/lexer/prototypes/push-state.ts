/**
 * Push new state onto stack and activate it
 */

import type { ILexer, LexerStateEnum } from '../lexer.types.js';
import { Lexer } from '../lexer.js';

Lexer.prototype.pushState = function (
  this: ILexer,
  newState: LexerStateEnum
): void {
  // Save current state to stack
  this.stateStack.push(this.state);
  
  // Activate new state
  this.state = newState;
};
