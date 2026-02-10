/**
 * Parser.prototype.parseIfStatement
 * if (condition) { ... } else { ... }
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IIfStatement, IStatementNode } from '../parser.types.js';

Parser.prototype.parseIfStatement = function (this: IParser): IIfStatement {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.IF);
  this.expect(TokenTypeEnum.LPAREN);
  const test = this.parseExpression();
  this.expect(TokenTypeEnum.RPAREN);

  const consequent = this.parseStatement();

  let alternate: IStatementNode | null = null;
  if (this.match(TokenTypeEnum.ELSE)) {
    this.advance();
    alternate = this.parseStatement();
  }

  const end = alternate?.end || consequent!.end;

  return {
    type: 'IfStatement',
    test,
    consequent: consequent!,
    alternate,
    start,
    end,
  };
};
