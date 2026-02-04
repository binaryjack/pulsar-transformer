import type {
  IASTNode,
  IBlockStatementNode,
  IDoWhileStatementNode,
  IForStatementNode,
  IWhileStatementNode,
} from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parses for loop statements
 * Supports: for (init; test; update) { }
 */
export function _parseForStatement(this: IParserInternal): IForStatementNode {
  const startToken = this.currentToken;

  // Expect 'for'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'for') {
    throw new Error(`Expected 'for', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'for'

  // Expect opening paren
  if (this.currentToken.type !== TokenType.PAREN_OPEN) {
    throw new Error(`Expected '(' after 'for', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume '('

  // Parse init (optional)
  let init: IASTNode | null = null;
  if (this.currentToken.type !== TokenType.SEMICOLON) {
    init = _parseSimpleExpression.call(this);
  }

  // Expect semicolon
  if (this.currentToken.type !== TokenType.SEMICOLON) {
    throw new Error(`Expected ';' after for init, got ${this.currentToken.value}`);
  }
  this.advance(); // Consume ';'

  // Parse test (optional)
  let test: IASTNode | null = null;
  if (this.currentToken.type !== TokenType.SEMICOLON) {
    test = _parseSimpleExpression.call(this);
  }

  // Expect semicolon
  if (this.currentToken.type !== TokenType.SEMICOLON) {
    throw new Error(`Expected ';' after for test, got ${this.currentToken.value}`);
  }
  this.advance(); // Consume ';'

  // Parse update (optional)
  let update: IASTNode | null = null;
  if (this.currentToken.type !== TokenType.PAREN_CLOSE) {
    update = _parseSimpleExpression.call(this);
  }

  // Expect closing paren
  if (this.currentToken.type !== TokenType.PAREN_CLOSE) {
    throw new Error(`Expected ')' after for header, got ${this.currentToken.value}`);
  }
  this.advance(); // Consume ')'

  // Parse body
  const body = _parseLoopBody.call(this);

  const endToken = this.currentToken;

  return {
    type: ASTNodeType.FOR_STATEMENT,
    init,
    test,
    update,
    body,
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
 * Parses while loop statements
 * Supports: while (test) { }
 */
export function _parseWhileStatement(this: IParserInternal): IWhileStatementNode {
  const startToken = this.currentToken;

  // Expect 'while'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'while') {
    throw new Error(`Expected 'while', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'while'

  // Expect opening paren
  if (this.currentToken.type !== TokenType.PAREN_OPEN) {
    throw new Error(`Expected '(' after 'while', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume '('

  // Parse test
  const test = _parseSimpleExpression.call(this);

  // Expect closing paren
  if (this.currentToken.type !== TokenType.PAREN_CLOSE) {
    throw new Error(`Expected ')' after while test, got ${this.currentToken.value}`);
  }

  this.advance(); // Consume ')'

  // Parse body
  const body = _parseLoopBody.call(this);

  const endToken = this.currentToken;

  return {
    type: ASTNodeType.WHILE_STATEMENT,
    test,
    body,
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
 * Parses do-while loop statements
 * Supports: do { } while (test);
 */
export function _parseDoWhileStatement(this: IParserInternal): IDoWhileStatementNode {
  const startToken = this.currentToken;

  // Expect 'do'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'do') {
    throw new Error(`Expected 'do', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'do'

  // Parse body
  const body = _parseLoopBody.call(this);

  // Expect 'while'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'while') {
    throw new Error(`Expected 'while' after do body, got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'while'

  // Expect opening paren
  if (this.currentToken.type !== TokenType.PAREN_OPEN) {
    throw new Error(`Expected '(' after 'while', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume '('

  // Parse test
  const test = _parseSimpleExpression.call(this);

  // Expect closing paren
  if (this.currentToken.type !== TokenType.PAREN_CLOSE) {
    throw new Error(`Expected ')' after while test, got ${this.currentToken.value}`);
  }

  this.advance(); // Consume ')'

  // Expect semicolon
  if (this.currentToken.type === TokenType.SEMICOLON) {
    this.advance(); // Consume ';'
  }

  const endToken = this.currentToken;

  return {
    type: ASTNodeType.DO_WHILE_STATEMENT,
    body,
    test,
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
 * Helper: Parse loop body (block or single statement)
 */
function _parseLoopBody(this: IParserInternal): IBlockStatementNode | IASTNode {
  if (this.currentToken.type === TokenType.BRACE_OPEN) {
    return _parseBlockStatement.call(this);
  } else {
    return this._parseStatement();
  }
}

/**
 * Helper: Parse block statement
 */
function _parseBlockStatement(this: IParserInternal): IBlockStatementNode {
  const startToken = this.currentToken;

  // Expect opening brace
  if (this.currentToken.type !== TokenType.BRACE_OPEN) {
    throw new Error(`Expected '{', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume '{'

  const body: IASTNode[] = [];

  while (
    this.currentToken.type !== TokenType.BRACE_CLOSE &&
    this.currentToken.type !== TokenType.EOF
  ) {
    body.push(this._parseStatement());
  }

  // Expect closing brace
  if (this.currentToken.type !== TokenType.BRACE_CLOSE) {
    throw new Error(`Expected '}', got ${this.currentToken.value}`);
  }

  const endToken = this.currentToken;
  this.advance(); // Consume '}'

  return {
    type: ASTNodeType.BLOCK_STATEMENT,
    body,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column + 1,
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

  throw new Error(`Unexpected token in expression: ${token.value}`);
}
