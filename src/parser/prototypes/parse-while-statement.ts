/**
 * Parser.prototype.parseWhileStatement
 * while (condition) { ... }
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IWhileStatement } from '../parser.types.js';

Parser.prototype.parseWhileStatement = function (this: IParser): IWhileStatement {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.WHILE);
  this.expect(TokenTypeEnum.LPAREN);
  const test = this.parseExpression();
  this.expect(TokenTypeEnum.RPAREN);

  const body = this.parseStatement();

  const end = body!.end;

  return {
    type: 'WhileStatement',
    test,
    body: body!,
    start,
    end,
  };
};
