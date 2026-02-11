/**
 * Check if token type is a keyword that can be used as JSX attribute name
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

Parser.prototype.isKeywordToken = function (this: IParser, tokenType: TokenTypeEnum): boolean {
  const keywordTypes: TokenTypeEnum[] = [
    TokenTypeEnum.COMPONENT,
    TokenTypeEnum.CONST,
    TokenTypeEnum.LET,
    TokenTypeEnum.VAR,
    TokenTypeEnum.FUNCTION,
    TokenTypeEnum.INTERFACE,
    TokenTypeEnum.EXPORT,
    TokenTypeEnum.IMPORT,
    TokenTypeEnum.FROM,
    TokenTypeEnum.RETURN,
    TokenTypeEnum.IF,
    TokenTypeEnum.ELSE,
    TokenTypeEnum.FOR,
    TokenTypeEnum.WHILE,
    TokenTypeEnum.TRUE,
    TokenTypeEnum.FALSE,
    TokenTypeEnum.NULL,
    TokenTypeEnum.UNDEFINED,
  ];

  return keywordTypes.includes(tokenType);
};
