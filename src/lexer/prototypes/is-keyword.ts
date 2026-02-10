/**
 * Lexer.prototype.isKeyword
 * Checks if identifier is keyword, returns token type
 */

import { Lexer } from '../lexer.js';
import type { ILexer, TokenTypeEnum } from '../lexer.types.js';
import { KEYWORDS } from '../lexer.types.js';

Lexer.prototype.isKeyword = function (this: ILexer, text: string): TokenTypeEnum | null {
  return KEYWORDS[text] ?? null;
};
