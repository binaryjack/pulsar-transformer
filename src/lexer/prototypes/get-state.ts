/**
 * Get current lexer state
 */

import { Lexer } from '../lexer.js';
import type { ILexer, LexerStateEnum } from '../lexer.types.js';

Lexer.prototype.getState = function (this: ILexer): LexerStateEnum {
  return this.state;
};
