import type { IAwaitExpressionNode } from '../ast/ast-node-types.js'
import { ASTNodeType } from '../ast/ast-node-types.js'
import { TokenType } from '../lexer/token-types.js'
import type { IParserInternal } from '../parser.types.js'

/**
 * Parse await expression
 *
 * @example
 * await promise;
 * await fetch('/api/data');
 */
export function _parseAwaitExpression(this: IParserInternal): IAwaitExpressionNode | null {
  const startToken = this._getCurrentToken();
  
  if (!startToken) {
    return null;
  }

  // Expect await
  if (startToken.type !== TokenType.AWAIT) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected await at line ${startToken.line}`,
      location: { line: startToken.line, column: startToken.column },
      token: startToken,
    });
    return null;
  }

  this._advance(); // consume await

  // Parse argument (required)
  const argument = this._parseExpression();

  const endPosition = argument?.location?.end;
  const endToken = this._getCurrentToken() || startToken;

  return {
    type: ASTNodeType.AWAIT_EXPRESSION,
    argument,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: endPosition
        ? {
            line: endPosition.line,
            column: endPosition.column,
            offset: endPosition.offset,
          }
        : {
            line: endToken.line || startToken.line,
            column: endToken.column || startToken.column,
            offset: endToken.start || startToken.start,
          },
    },
  };
}
