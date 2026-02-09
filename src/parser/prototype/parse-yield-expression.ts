import type { IYieldExpressionNode } from '../ast/ast-node-types.js'
import { ASTNodeType } from '../ast/ast-node-types.js'
import { TokenType } from '../lexer/token-types.js'
import type { IParserInternal } from '../parser.types.js'

/**
 * Parse yield expression
 *
 * @example
 * yield value;
 * yield* iterable;
 */
export function _parseYieldExpression(this: IParserInternal): IYieldExpressionNode {
  const startToken = this._getCurrentToken()!;

  // Expect yield
  if (startToken.type !== TokenType.YIELD) {
    throw new Error(`Expected yield at line ${startToken.line}`);
  }

  this._advance(); // consume yield

  // Check for delegate (yield*)
  let delegate = false;
  const next = this._getCurrentToken()!;
  if (next.type === TokenType.ASTERISK) {
    delegate = true;
    this._advance(); // consume *
  }

  // Parse argument (optional)
  let argument: any = null;
  const current = this._getCurrentToken();

  // If next token is not semicolon or newline, parse a full expression
  if (current && current.type !== TokenType.SEMICOLON && current.type !== TokenType.NEWLINE) {
    argument = this._parseExpression();
  }

  const endToken = argument?.location?.end || startToken;

  return {
    type: ASTNodeType.YIELD_EXPRESSION,
    argument,
    delegate,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column,
        offset: endToken.offset ?? endToken.end,
      },
    },
  };
}
