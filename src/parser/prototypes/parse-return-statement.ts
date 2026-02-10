/**
 * Parser.prototype.parseReturnStatement
 * return <expression>;
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IReturnStatement } from '../parser.types.js';

Parser.prototype.parseReturnStatement = function (this: IParser): IReturnStatement {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.RETURN);

  let argument = null;

  // Check if there's an argument
  if (!this.match(TokenTypeEnum.SEMICOLON) && !this.match(TokenTypeEnum.RBRACE)) {
    argument = this.parseExpression();
  }

  // Optional semicolon
  if (this.match(TokenTypeEnum.SEMICOLON)) {
    this.advance();
  }

  return {
    type: 'ReturnStatement',
    argument,
    start,
    end: argument?.end || start,
  };
};
