import type { IASTNode, ISwitchCaseNode, ISwitchStatementNode } from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parses switch statements
 * Supports: switch (x) { case 1: break; default: break; }
 */
export function _parseSwitchStatement(this: IParserInternal): ISwitchStatementNode {
  const startToken = this._getCurrentToken();

  // Expect 'switch'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'switch'
  ) {
    throw new Error(`Expected 'switch', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'switch'

  // Expect opening paren
  if (this._getCurrentToken()!.type !== TokenType.LPAREN) {
    throw new Error(`Expected '(' after 'switch', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '('

  // Parse discriminant expression
  const discriminant = parseExpression.call(this);

  // Expect closing paren
  if (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    throw new Error(`Expected ')' after switch discriminant, got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume ')'

  // Expect opening brace
  if (this._getCurrentToken()!.type !== TokenType.LBRACE) {
    throw new Error(`Expected '{' after switch header, got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '{'

  // Parse cases
  const cases: ISwitchCaseNode[] = [];

  while (
    this._getCurrentToken()!.type !== TokenType.RBRACE &&
    this._getCurrentToken()!.type !== TokenType.EOF
  ) {
    if (
      this._getCurrentToken()!.type === TokenType.IDENTIFIER &&
      (this._getCurrentToken()!.value === 'case' || this._getCurrentToken()!.value === 'default')
    ) {
      cases.push(_parseSwitchCase.call(this));
    } else {
      // Skip unexpected tokens
      this._advance();
    }
  }

  // Expect closing brace
  if (this._getCurrentToken()!.type !== TokenType.RBRACE) {
    throw new Error(`Expected '}' to close switch, got ${this._getCurrentToken()!.value}`);
  }

  const endToken = this._getCurrentToken();
  this._advance(); // Consume '}'

  // Build location
  const start = {
    line: startToken!.line,
    column: startToken!.column,
    offset: startToken!.start,
  };

  const end = {
    line: endToken!.line,
    column: endToken!.column + 1,
    offset: endToken!.end,
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
  const startToken = this._getCurrentToken();

  let test: IASTNode | null = null;

  // Check if 'case' or 'default'
  if (this._getCurrentToken()!.value === 'case') {
    this._advance(); // Consume 'case'

    // Parse test expression
    test = parseExpression.call(this);

    // Expect colon
    if (this._getCurrentToken()!.type !== TokenType.COLON) {
      throw new Error(`Expected ':' after case test, got ${this._getCurrentToken()!.value}`);
    }

    this._advance(); // Consume ':'
  } else if (this._getCurrentToken()!.value === 'default') {
    this._advance(); // Consume 'default'

    // Expect colon
    if (this._getCurrentToken()!.type !== TokenType.COLON) {
      throw new Error(`Expected ':' after 'default', got ${this._getCurrentToken()!.value}`);
    }

    this._advance(); // Consume ':'
  } else {
    throw new Error(`Expected 'case' or 'default', got ${this._getCurrentToken()!.value}`);
  }

  // Parse consequent statements (until next case/default or closing brace)
  const consequent: IASTNode[] = [];

  while (
    this._getCurrentToken()!.type !== TokenType.BRACE_CLOSE &&
    this._getCurrentToken()!.type !== TokenType.EOF &&
    !(
      this._getCurrentToken()!.type === TokenType.IDENTIFIER &&
      (this._getCurrentToken()!.value === 'case' || this._getCurrentToken()!.value === 'default')
    )
  ) {
    consequent.push(this._parseStatement());
  }

  const endToken = this._getCurrentToken();

  // Build location
  const start = {
    line: startToken!.line,
    column: startToken!.column,
    offset: startToken!.start,
  };

  const end = {
    line: endToken!.line,
    column: endToken!.column,
    offset: endToken!.end,
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

  if (token.type === TokenType.NUMBER || token.type === TokenType.STRING) {
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

  throw new Error(`Unexpected token in expression: ${token.value}`);
}
