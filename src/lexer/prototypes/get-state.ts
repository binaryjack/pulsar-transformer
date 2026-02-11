/**
 * Get current lexer state
 */

import type { ILexer, LexerStateEnum } from '../lexer.types.js';
import { Lexer } from '../lexer.js';

Lexer.prototype.getState = function (this: ILexer): LexerStateEnum {
  return this.state;
};
