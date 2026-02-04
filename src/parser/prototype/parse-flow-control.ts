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
  const startToken = this._getCurrentToken();

  // Expect 'throw'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'throw'
  ) {
    throw new Error(`Expected 'throw', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'throw'

  // Parse argument expression
  const argument = _parseSimpleExpression.call(this);

  // Expect semicolon (optional)
  if (this._getCurrentToken()!.type === TokenType.SEMICOLON) {
    this._advance(); // Consume ';'
  }

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.THROW_STATEMENT,
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

/**
 * Parses break statements
 * Supports: break; or break label;
 */
export function _parseBreakStatement(this: IParserInternal): IBreakStatementNode {
  const startToken = this._getCurrentToken();

  // Expect 'break'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'break'
  ) {
    throw new Error(`Expected 'break', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'break'

  // Parse optional label
  let label: IIdentifierNode | null = null;

  if (
    this._getCurrentToken()!.type === TokenType.IDENTIFIER &&
    this._getCurrentToken()!.type !== TokenType.SEMICOLON
  ) {
    const labelToken = this._getCurrentToken();
    label = {
      type: ASTNodeType.IDENTIFIER,
      name: labelToken!.value,
      location: {
        start: {
          line: labelToken!.line,
          column: labelToken!.column,
          offset: labelToken!.start,
        },
        end: {
          line: labelToken!.line,
          column: labelToken!.column + labelToken!.value.length,
          offset: labelToken!.end,
        },
      },
    };
    this._advance(); // Consume label
  }

  // Expect semicolon (optional)
  if (this._getCurrentToken()!.type === TokenType.SEMICOLON) {
    this._advance(); // Consume ';'
  }

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.BREAK_STATEMENT,
    label,
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

/**
 * Parses continue statements
 * Supports: continue; or continue label;
 */
export function _parseContinueStatement(this: IParserInternal): IContinueStatementNode {
  const startToken = this._getCurrentToken();

  // Expect 'continue'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'continue'
  ) {
    throw new Error(`Expected 'continue', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'continue'

  // Parse optional label
  let label: IIdentifierNode | null = null;

  if (
    this._getCurrentToken()!.type === TokenType.IDENTIFIER &&
    this._getCurrentToken()!.type !== TokenType.SEMICOLON
  ) {
    const labelToken = this._getCurrentToken();
    label = {
      type: ASTNodeType.IDENTIFIER,
      name: labelToken!.value,
      location: {
        start: {
          line: labelToken!.line,
          column: labelToken!.column,
          offset: labelToken!.start,
        },
        end: {
          line: labelToken!.line,
          column: labelToken!.column + labelToken!.value.length,
          offset: labelToken!.end,
        },
      },
    };
    this._advance(); // Consume label
  }

  // Expect semicolon (optional)
  if (this._getCurrentToken()!.type === TokenType.SEMICOLON) {
    this._advance(); // Consume ';'
  }

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.CONTINUE_STATEMENT,
    label,
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

/**
 * Helper: Parse simple expression
 */
function _parseSimpleExpression(this: IParserInternal): IASTNode {
  const token = this._getCurrentToken();

  if (token.type === TokenType.IDENTIFIER) {
    this._advance();
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
    token.type === TokenType.NUMBER ||
    token.type === TokenType.NUMBER
  ) {
    this._advance();
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
    this._advance(); // Consume 'new'

    const constructorToken = this._getCurrentToken();
    if (constructorToken!.type !== TokenType.IDENTIFIER) {
      throw new Error(`Expected constructor name after 'new'`);
    }

    this._advance(); // Consume constructor name

    // Skip arguments if present
    if (this._getCurrentToken()!.type === TokenType.LPAREN) {
      let depth = 1;
      this._advance(); // Consume '('

      while (depth > 0 && this._getCurrentToken()!.type !== TokenType.EOF) {
        if (this._getCurrentToken()!.type === TokenType.LPAREN) {
          depth++;
        } else if (this._getCurrentToken()!.type === TokenType.RPAREN) {
          depth--;
        }
        this._advance();
      }
    }

    return {
      type: ASTNodeType.IDENTIFIER,
      name: `new ${constructorToken!.value}`,
      location: {
        start: {
          line: token.line,
          column: token.column,
          offset: token.start,
        },
        end: {
          line: this._getCurrentToken()!.line,
          column: this._getCurrentToken()!.column,
          offset: this._getCurrentToken()!.end,
        },
      },
    };
  }

  throw new Error(`Unexpected token in expression: ${token.value}`);
}
