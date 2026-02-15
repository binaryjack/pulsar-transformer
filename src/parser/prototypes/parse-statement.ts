/**
 * Parser.prototype.parseStatement
 * Route to appropriate statement parser based on token type
 */

import { getTracerManager } from '../../debug/tracer/core/tracer-manager.js';
import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IStatementNode } from '../parser.types.js';

Parser.prototype.parseStatement = function (this: IParser): IStatementNode | null {
  const tracer = getTracerManager();
  const token = this.peek();

  // Trace statement routing
  if (tracer.isEnabled()) {
    tracer.trace('parser', {
      type: 'statement.route',
      tokenType: token.type,
      position: this.current,
    } as any);
  }

  switch (token.type) {
    case TokenTypeEnum.IMPORT:
      return this.parseImportDeclaration();

    case TokenTypeEnum.EXPORT:
      return this.parseExportDeclaration();

    case TokenTypeEnum.INTERFACE:
      return this.parseInterfaceDeclaration();

    case TokenTypeEnum.COMPONENT:
      return this.parseComponentDeclaration();

    case TokenTypeEnum.FUNCTION:
      return this.parseFunctionDeclaration();

    case TokenTypeEnum.CONST:
    case TokenTypeEnum.LET:
    case TokenTypeEnum.VAR:
      return this.parseVariableDeclaration();

    case TokenTypeEnum.RETURN:
      return this.parseReturnStatement();

    case TokenTypeEnum.IF:
      return this.parseIfStatement();

    case TokenTypeEnum.FOR:
      return this.parseForStatement();

    case TokenTypeEnum.WHILE:
      return this.parseWhileStatement();

    case TokenTypeEnum.LBRACE:
      return this.parseBlockStatement();

    case TokenTypeEnum.SEMICOLON:
      // Empty statement
      this.advance();
      return null;

    default:
      // Try expression statement
      // Trace fallback to expression parsing
      if (tracer.isEnabled()) {
        tracer.trace('parser', {
          type: 'statement.expression-fallback',
          tokenType: token.type,
          value: token.value,
        } as any);
      }

      const expr = this.parseExpression();

      // Consume optional semicolon
      if (this.match(TokenTypeEnum.SEMICOLON)) {
        this.advance();
      }

      return {
        type: 'ExpressionStatement',
        expression: expr,
        start: expr.start,
        end: expr.end,
      };
  }
};
