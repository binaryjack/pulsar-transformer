/**
 * Parser.prototype.parseProgram
 * Parse top-level program structure
 */

import { getTracerManager } from '../../debug/tracer/core/tracer-manager.js';
import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IProgramNode, IStatementNode } from '../parser.types.js';

Parser.prototype.parseProgram = function (this: IParser): IProgramNode {
  const tracer = getTracerManager();
  const start = this.peek().start;
  const body: IStatementNode[] = [];
  const statementTypes: string[] = [];

  while (!this.isAtEnd()) {
    // Skip comments
    if (this.match(TokenTypeEnum.COMMENT)) {
      this.advance();
      continue;
    }

    const stmt = this.parseStatement();
    if (stmt) {
      body.push(stmt);
      statementTypes.push(stmt.type);

      // Trace each parsed statement
      if (tracer.isEnabled()) {
        tracer.trace('parser', {
          type: 'statement.parsed',
          statementType: stmt.type,
          index: body.length - 1,
        } as any);
      }
    } else {
      // Track null statement (potential parse failure)
      if (tracer.isEnabled()) {
        tracer.trace('parser', {
          type: 'statement.null',
          token: this.peek().type,
          position: this.current,
        } as any);
      }
    }
  }

  const end = this.tokens[this.tokens.length - 1]?.end || 0;

  // Trace program structure summary
  if (tracer.isEnabled()) {
    tracer.trace('parser', {
      type: 'program.complete',
      statementCount: body.length,
      statementTypes: statementTypes,
    } as any);
  }

  return {
    type: 'Program',
    body,
    sourceType: 'module',
    start,
    end,
  };
};
