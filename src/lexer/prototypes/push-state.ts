/**
 * Push new state onto stack and activate it
 */

import { Lexer } from '../lexer.js';
import type { ILexer, LexerStateEnum } from '../lexer.types.js';

Lexer.prototype.pushState = function (this: ILexer, newState: LexerStateEnum): void {
  // Save current state to stack
  this.stateStack.push(this.state);

  // Activate new state
  this.state = newState;
};
