/**
 * Parser.prototype.parseBlockStatement
 * { ... statements ... }
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IBlockStatement, IStatementNode } from '../parser.types.js';

Parser.prototype.parseBlockStatement = function (this: IParser): IBlockStatement {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.LBRACE);

  const body: IStatementNode[] = [];

  while (!this.match(TokenTypeEnum.RBRACE) && !this.isAtEnd()) {
    // Skip comments
    if (this.match(TokenTypeEnum.COMMENT)) {
      this.advance();
      continue;
    }

    const stmt = this.parseStatement();
    if (stmt) {
      body.push(stmt);
    }
  }

  const end = this.peek().end;
  this.expect(TokenTypeEnum.RBRACE);

  return {
    type: 'BlockStatement',
    body,
    start,
    end,
  };
};
