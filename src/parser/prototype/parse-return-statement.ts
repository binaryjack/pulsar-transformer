/**
 * Parse Return Statement
 *
 * Parses return statements (commonly used in component bodies).
 *
 * @example
 * return <button>Click</button>;
 */

import type { IReturnStatementNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse return statement
 *
 * Grammar:
 *   return Expression? ;
 */
export function parseReturnStatement(this: IParserInternal): IReturnStatementNode {
  const startToken = this._getCurrentToken()!;

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseReturnStatement: START', {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  // Consume 'return' keyword
  this._expect('RETURN', 'Expected "return" keyword');

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseReturnStatement: After RETURN', {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  let argument: any = null;

  // Check for return value
  if (!this._check('SEMICOLON') && !this._isAtEnd()) {
    if (this._logger) {
      this._logger.log('parser', 'debug', 'parseReturnStatement: About to parse expression', {
        currentToken: this._getCurrentToken()?.type,
        position: this._current,
      });
    }
    argument = this._parseExpression();
    if (this._logger) {
      this._logger.log('parser', 'debug', 'parseReturnStatement: Expression parsed', {
        argumentType: argument?.type,
        position: this._current,
      });
    }
  }

  // Consume optional semicolon
  this._match('SEMICOLON');

  const endToken = this._getCurrentToken() || startToken;

  return {
    type: ASTNodeType.RETURN_STATEMENT,
    argument,
    location: {
      start: {
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.end,
      },
    },
  };
}
