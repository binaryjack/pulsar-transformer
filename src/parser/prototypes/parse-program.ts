/**
 * Parser.prototype.parseProgram
 * Parse top-level program structure
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IProgramNode, IStatementNode } from '../parser.types.js';

Parser.prototype.parseProgram = function (this: IParser): IProgramNode {
  const start = this.peek().start;
  const body: IStatementNode[] = [];

  while (!this.isAtEnd()) {
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

  const end = this.tokens[this.tokens.length - 1]?.end || 0;

  return {
    type: 'Program',
    body,
    sourceType: 'module',
    start,
    end,
  };
};
