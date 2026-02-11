/**
 * Check if lexer is in any JSX context
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { LexerStateEnum } from '../lexer.types.js';

Lexer.prototype.isInJSX = function (this: ILexer): boolean {
  return this.state === LexerStateEnum.InsideJSX || this.state === LexerStateEnum.InsideJSXText;
};
