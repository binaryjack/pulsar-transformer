import type { IASTNode, ISwitchCaseNode, ISwitchStatementNode } from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parses switch statements
 * Supports: switch (x) { case 1: break; default: break; }
 */
export function _parseSwitchStatement(this: IParserInternal): ISwitchStatementNode {
  const startToken = this.currentToken;

  // Expect 'switch'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'switch') {
    throw new Error(`Expected 'switch', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'switch'

  // Expect opening paren
  if (this.currentToken.type !== TokenType.PAREN_OPEN) {
    throw new Error(`Expected '(' after 'switch', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume '('

  // Parse discriminant expression
  const discriminant = parseExpression.call(this);

  // Expect closing paren
  if (this.currentToken.type !== TokenType.PAREN_CLOSE) {
    throw new Error(`Expected ')' after switch discriminant, got ${this.currentToken.value}`);
  }

  this.advance(); // Consume ')'

  // Expect opening brace
  if (this.currentToken.type !== TokenType.BRACE_OPEN) {
    throw new Error(`Expected '{' after switch header, got ${this.currentToken.value}`);
  }

  this.advance(); // Consume '{'

  // Parse cases
  const cases: ISwitchCaseNode[] = [];

  while (
    this.currentToken.type !== TokenType.BRACE_CLOSE &&
    this.currentToken.type !== TokenType.EOF
  ) {
    if (
      this.currentToken.type === TokenType.IDENTIFIER &&
      (this.currentToken.value === 'case' || this.currentToken.value === 'default')
    ) {
      cases.push(_parseSwitchCase.call(this));
    } else {
      // Skip unexpected tokens
      this.advance();
    }
  }

  // Expect closing brace
  if (this.currentToken.type !== TokenType.BRACE_CLOSE) {
    throw new Error(`Expected '}' to close switch, got ${this.currentToken.value}`);
  }

  const endToken = this.currentToken;
  this.advance(); // Consume '}'

  // Build location
  const start = {
    line: startToken.line,
    column: startToken.column,
    offset: startToken.start,
  };

  const end = {
    line: endToken.line,
    column: endToken.column + 1,
    offset: endToken.end,
  };

  return {
    type: ASTNodeType.SWITCH_STATEMENT,
    discriminant,
    cases,
    location: {
      start,
      end,
    },
  };
}

/**
 * Helper: Parse switch case
 */
function _parseSwitchCase(this: IParserInternal): ISwitchCaseNode {
  const startToken = this.currentToken;

  let test: IASTNode | null = null;

  // Check if 'case' or 'default'
  if (this.currentToken.value === 'case') {
    this.advance(); // Consume 'case'

    // Parse test expression
    test = parseExpression.call(this);

    // Expect colon
    if (this.currentToken.type !== TokenType.COLON) {
      throw new Error(`Expected ':' after case test, got ${this.currentToken.value}`);
    }

    this.advance(); // Consume ':'
  } else if (this.currentToken.value === 'default') {
    this.advance(); // Consume 'default'

    // Expect colon
    if (this.currentToken.type !== TokenType.COLON) {
      throw new Error(`Expected ':' after 'default', got ${this.currentToken.value}`);
    }

    this.advance(); // Consume ':'
  } else {
    throw new Error(`Expected 'case' or 'default', got ${this.currentToken.value}`);
  }

  // Parse consequent statements (until next case/default or closing brace)
  const consequent: IASTNode[] = [];

  while (
    this.currentToken.type !== TokenType.BRACE_CLOSE &&
    this.currentToken.type !== TokenType.EOF &&
    !(
      this.currentToken.type === TokenType.IDENTIFIER &&
      (this.currentToken.value === 'case' || this.currentToken.value === 'default')
    )
  ) {
    consequent.push(this._parseStatement());
  }

  const endToken = this.currentToken;

  // Build location
  const start = {
    line: startToken.line,
    column: startToken.column,
    offset: startToken.start,
  };

  const end = {
    line: endToken.line,
    column: endToken.column,
    offset: endToken.end,
  };

  return {
    type: ASTNodeType.SWITCH_CASE,
    test,
    consequent,
    location: {
      start,
      end,
    },
  };
}

/**
 * Simple expression parser for switch discriminant
 */
function parseExpression(this: IParserInternal): IASTNode {
  // For now, just grab the identifier or literal
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

  throw new Error(`Unexpected token in expression: ${token.value}`);
}
