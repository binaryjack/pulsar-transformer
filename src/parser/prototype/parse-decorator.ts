import type {
  ICallExpressionNode,
  IDecoratorNode,
  IIdentifierNode,
} from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse decorator
 *
 * @example
 * @Component({ selector: 'app-root' })
 * @Injectable()
 * @Custom
 */
export function _parseDecorator(this: IParserInternal): IDecoratorNode {
  const startToken = this._getCurrentToken()!;

  // Expect @
  if (startToken.type !== TokenType.AT) {
    throw new Error(`Expected @ for decorator at line ${startToken.line}`);
  }

  this._advance(); // consume @

  // Parse decorator expression (identifier or call expression)
  const expression = _parseDecoratorExpression.call(this);

  const endToken = this._getCurrentToken()!;

  return {
    type: ASTNodeType.DECORATOR,
    expression,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.start,
      },
    },
  };
}

/**
 * Parse decorator expression (identifier or call)
 */
function _parseDecoratorExpression(this: IParserInternal): IIdentifierNode | ICallExpressionNode {
  const token = this._getCurrentToken()!;

  if (token.type !== TokenType.IDENTIFIER) {
    throw new Error(`Expected identifier in decorator at line ${token.line}`);
  }

  const identifier: IIdentifierNode = {
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

  this._advance(); // consume identifier

  // Check if it's a call expression
  const next = this._getCurrentToken();
  if (next && next.type === TokenType.LPAREN) {
    return _parseDecoratorCall.call(this, identifier);
  }

  return identifier;
}

/**
 * Parse decorator call expression
 */
function _parseDecoratorCall(this: IParserInternal, callee: IIdentifierNode): ICallExpressionNode {
  const startToken = callee.location.start;

  this._advance(); // consume (

  // Parse arguments (simplified - just parse until closing paren)
  const args: any[] = [];

  while (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    // Skip everything until we find the closing paren
    // In a real implementation, we'd parse the argument expressions
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
