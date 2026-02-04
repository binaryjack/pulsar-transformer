import type { IAwaitExpressionNode } from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse await expression
 *
 * @example
 * await promise;
 * await fetch('/api/data');
 */
export function _parseAwaitExpression(this: IParserInternal): IAwaitExpressionNode {
  const startToken = this._getCurrentToken()!;

  // Expect await
  if (startToken.type !== TokenType.AWAIT) {
    throw new Error(`Expected await at line ${startToken.line}`);
  }

  this._advance(); // consume await

  // Parse argument (required)
  const argument = _parseSimpleExpression.call(this);

  const endToken = this._getCurrentToken()!;

  return {
    type: ASTNodeType.AWAIT_EXPRESSION,
    argument,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.offset,
      },
    },
  };
}

/**
 * Parse simple expression (identifier, call, or literal)
 */
function _parseSimpleExpression(this: IParserInternal): any {
  const token = this._getCurrentToken()!;

  if (token.type === TokenType.IDENTIFIER) {
    const identifierNode = {
      type: ASTNodeType.IDENTIFIER,
      name: token.value,
      location: {
        start: {
          line: token.line,
          column: token.column,
          offset: token.start,
        },
        end: {
          line: token.line,
          column: token.column + token.value.length,
          offset: token.end,
        },
      },
    };
    this._advance();

    // Check for call expression
    const next = this._getCurrentToken();
    if (next && next.type === TokenType.LPAREN) {
      return _parseCallExpression.call(this, identifierNode);
    }

    return identifierNode;
  }

  if (token.type === TokenType.NUMBER || token.type === TokenType.STRING) {
    const node = {
      type: ASTNodeType.LITERAL,
      value: token.value,
      location: {
        start: {
          line: token.line,
          column: token.column,
          offset: token.start,
        },
        end: {
          line: token.line,
          column: token.column + token.value.length,
          offset: token.end,
        },
      },
    };
    this._advance();
    return node;
  }

  throw new Error(`Expected expression at line ${token.line}`);
}

/**
 * Parse call expression
 */
function _parseCallExpression(this: IParserInternal, callee: any): any {
  const startToken = callee.location.start;

  this._advance(); // consume (

  // Parse arguments (simplified)
  const args: any[] = [];

  while (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    // Skip everything until closing paren
    // In real implementation, parse argument expressions
    this._advance();
  }

  const endToken = this._getCurrentToken()!;
  this._advance(); // consume )

  return {
    type: ASTNodeType.CALL_EXPRESSION,
    callee,
    arguments: args,
    location: {
      start: startToken,
      end: {
        line: endToken.line,
        column: endToken.column + 1,
        offset: endToken.end,
      },
    },
  };
}
