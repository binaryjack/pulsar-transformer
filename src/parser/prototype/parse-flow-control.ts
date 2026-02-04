import type {
  IASTNode,
  IBreakStatementNode,
  IContinueStatementNode,
  IThrowStatementNode,
} from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parses throw statements
 * Supports: throw expression;
 */
export function _parseThrowStatement(this: IParserInternal): IThrowStatementNode {
  const startToken = this.currentToken;

  // Expect 'throw'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'throw') {
    throw new Error(`Expected 'throw', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'throw'

  // Parse argument expression
  const argument = _parseSimpleExpression.call(this);

  // Expect semicolon (optional)
  if (this.currentToken.type === TokenType.SEMICOLON) {
    this.advance(); // Consume ';'
  }

  const endToken = this.currentToken;

  return {
    type: ASTNodeType.THROW_STATEMENT,
    argument,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column,
        offset: endToken.end,
      },
    },
  };
}

/**
 * Parses break statements
 * Supports: break; or break label;
 */
export function _parseBreakStatement(this: IParserInternal): IBreakStatementNode {
  const startToken = this.currentToken;

  // Expect 'break'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'break') {
    throw new Error(`Expected 'break', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'break'

  // Parse optional label
  let label: string | null = null;

  if (
    this.currentToken.type === TokenType.IDENTIFIER &&
    this.currentToken.type !== TokenType.SEMICOLON
  ) {
    label = this.currentToken.value;
    this.advance(); // Consume label
  }

  // Expect semicolon (optional)
  if (this.currentToken.type === TokenType.SEMICOLON) {
    this.advance(); // Consume ';'
  }

  const endToken = this.currentToken;

  return {
    type: ASTNodeType.BREAK_STATEMENT,
    label,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column,
        offset: endToken.end,
      },
    },
  };
}

/**
 * Parses continue statements
 * Supports: continue; or continue label;
 */
export function _parseContinueStatement(this: IParserInternal): IContinueStatementNode {
  const startToken = this.currentToken;

  // Expect 'continue'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'continue') {
    throw new Error(`Expected 'continue', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'continue'

  // Parse optional label
  let label: string | null = null;

  if (
    this.currentToken.type === TokenType.IDENTIFIER &&
    this.currentToken.type !== TokenType.SEMICOLON
  ) {
    label = this.currentToken.value;
    this.advance(); // Consume label
  }

  // Expect semicolon (optional)
  if (this.currentToken.type === TokenType.SEMICOLON) {
    this.advance(); // Consume ';'
  }

  const endToken = this.currentToken;

  return {
    type: ASTNodeType.CONTINUE_STATEMENT,
    label,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column,
        offset: endToken.end,
      },
    },
  };
}

/**
 * Helper: Parse simple expression
 */
function _parseSimpleExpression(this: IParserInternal): IASTNode {
  const token = this.currentToken;

  if (token.type === TokenType.IDENTIFIER) {
    this.advance();
    return {
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
  }

  if (
    token.type === TokenType.NUMBER ||
    token.type === TokenType.STRING ||
    token.type === TokenType.TRUE ||
    token.type === TokenType.FALSE
  ) {
    this.advance();
    return {
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
  }

  // Handle 'new Error(...)' for throw statements
  if (token.type === TokenType.IDENTIFIER && token.value === 'new') {
    this.advance(); // Consume 'new'

    const constructorToken = this.currentToken;
    if (constructorToken.type !== TokenType.IDENTIFIER) {
      throw new Error(`Expected constructor name after 'new'`);
    }

    this.advance(); // Consume constructor name

    // Skip arguments if present
    if (this.currentToken.type === TokenType.PAREN_OPEN) {
      let depth = 1;
      this.advance(); // Consume '('

      while (depth > 0 && this.currentToken.type !== TokenType.EOF) {
        if (this.currentToken.type === TokenType.PAREN_OPEN) {
          depth++;
        } else if (this.currentToken.type === TokenType.PAREN_CLOSE) {
          depth--;
        }
        this.advance();
      }
    }

    return {
      type: ASTNodeType.IDENTIFIER,
      name: `new ${constructorToken.value}`,
      location: {
        start: {
          line: token.line,
          column: token.column,
          offset: token.start,
        },
        end: {
          line: this.currentToken.line,
          column: this.currentToken.column,
          offset: this.currentToken.end,
        },
      },
    };
  }

  throw new Error(`Unexpected token in expression: ${token.value}`);
}
