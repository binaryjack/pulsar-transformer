import type {
  ICallExpressionNode,
  IDecoratorNode,
  IIdentifierNode,
} from '../ast/ast-node-types.js'
import { ASTNodeType } from '../ast/ast-node-types.js'
import { TokenType } from '../lexer/token-types.js'
import type { IParserInternal } from '../parser.types.js'

/**
 * Parse decorator
 *
 * @example
 * @Component({ selector: 'app-root' })
 * @Injectable()
 * @Custom
 */
export function _parseDecorator(this: IParserInternal): IDecoratorNode | null {
  const startToken = this._getCurrentToken();
  
  if (!startToken) {
    return null;
  }

  // Expect @
  if (startToken.type !== TokenType.AT) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected @ for decorator at line ${startToken.line}`,
      location: { line: startToken.line, column: startToken.column },
      token: startToken,
    });
    return null;
  }

  this._advance(); // consume @

  // Parse decorator expression (identifier or call expression)
  const expression = _parseDecoratorExpression.call(this);
  
  if (!expression) {
    return null;
  }

  const endToken = this._getCurrentToken() || startToken;

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
        line: endToken.line || startToken.line,
        column: endToken.column || startToken.column,
        offset: endToken.start || startToken.start,
      },
    },
  };
}

/**
 * Parse decorator  expression (identifier or call)
 */
function _parseDecoratorExpression(this: IParserInternal): IIdentifierNode | ICallExpressionNode | null {
  const token = this._getCurrentToken();
  
  if (!token) {
    return null;
  }

  if (token.type !== TokenType.IDENTIFIER) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected identifier in decorator at line ${token.line}`,
      location: { line: token.line, column: token.column },
      token,
    });
    return null;
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
  
  // SAFETY: Add position tracking to prevent infinite loops
  let safetyCounter = 0;
  const maxIterations = 10000;

  while (!this._isAtEnd()) {
    const currentToken = this._getCurrentToken();
    if (!currentToken || currentToken.type === TokenType.RPAREN) {
      break;
    }
    
    if (++safetyCounter > maxIterations) {
      this._addError({
        code: 'PSR-E010',
        message: `Infinite loop detected while parsing decorator arguments (${maxIterations} iterations exceeded)`,
        location: {
          line: currentToken.line,
          column: currentToken.column,
        },
      });
      break;
    }
    
    const beforePos = this._current;
    // Skip everything until we find the closing paren
    // In a real implementation, we'd parse the argument expressions
    this._advance();
    
    // SAFETY: Ensure we're making progress
    if (this._current === beforePos) {
      this._addError({
        code: 'PSR-E011',
        message: 'Parser stuck in decorator arguments - forcing advance',
        location: {
          line: currentToken.line,
          column: currentToken.column,
        },
      });
      this._advance(); // Force progress
      break;
    }
  }

  const endToken = this._getCurrentToken();
  if (endToken?.type === TokenType.RPAREN) {
    this._advance(); // consume )
  }

  return {
    type: ASTNodeType.CALL_EXPRESSION,
    callee,
    arguments: args,
    location: {
      start: startToken,
      end: endToken ? {
        line: endToken.line,
        column: endToken.column + 1,
        offset: endToken.end,
      } : {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.offset,
      },
    },
  };
}
