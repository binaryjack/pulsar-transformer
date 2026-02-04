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
  const startToken = this._getCurrentToken();

  // Expect 'for'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'for'
  ) {
    throw new Error(`Expected 'for', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'for'

  // Expect opening paren
  if (this._getCurrentToken()!.type !== TokenType.LPAREN) {
    throw new Error(`Expected '(' after 'for', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '('

  // Parse init (optional)
  let init: IASTNode | null = null;
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    init = _parseSimpleExpression.call(this);
  }

  // Expect semicolon
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    throw new Error(`Expected ';' after for init, got ${this._getCurrentToken()!.value}`);
  }
  this._advance(); // Consume ';'

  // Parse test (optional)
  let test: IASTNode | null = null;
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    test = _parseSimpleExpression.call(this);
  }

  // Expect semicolon
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    throw new Error(`Expected ';' after for test, got ${this._getCurrentToken()!.value}`);
  }
  this._advance(); // Consume ';'

  // Parse update (optional)
  let update: IASTNode | null = null;
  if (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    update = _parseSimpleExpression.call(this);
  }

  // Expect closing paren
  if (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    throw new Error(`Expected ')' after for header, got ${this._getCurrentToken()!.value}`);
  }
  this._advance(); // Consume ')'

  // Parse body
  const body = _parseLoopBody.call(this);

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.FOR_STATEMENT,
    init,
    test,
    update,
    body,
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
 * Parses while loop statements
 * Supports: while (test) { }
 */
export function _parseWhileStatement(this: IParserInternal): IWhileStatementNode {
  const startToken = this._getCurrentToken();

  // Expect 'while'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'while'
  ) {
    throw new Error(`Expected 'while', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'while'

  // Expect opening paren
  if (this._getCurrentToken()!.type !== TokenType.PAREN_OPEN) {
    throw new Error(`Expected '(' after 'while', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '('

  // Parse test
  const test = _parseSimpleExpression.call(this);

  // Expect closing paren
  if (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    throw new Error(`Expected ')' after while test, got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume ')'

  // Parse body
  const body = _parseLoopBody.call(this);

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.WHILE_STATEMENT,
    test,
    body,
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
 * Parses do-while loop statements
 * Supports: do { } while (test);
 */
export function _parseDoWhileStatement(this: IParserInternal): IDoWhileStatementNode {
  const startToken = this._getCurrentToken();

  // Expect 'do'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'do'
  ) {
    throw new Error(`Expected 'do', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'do'

  // Parse body (must be block statement for AST)
  const body = _parseLoopBody.call(this) as IBlockStatementNode;

  // Expect 'while'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'while'
  ) {
    throw new Error(`Expected 'while' after do body, got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'while'

  // Expect opening paren
  if (this._getCurrentToken()!.type !== TokenType.PAREN_OPEN) {
    throw new Error(`Expected '(' after 'while', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '('

  // Parse test
  const test = _parseSimpleExpression.call(this);

  // Expect closing paren
  if (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    throw new Error(`Expected ')' after while test, got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume ')'

  // Expect semicolon
  if (this._getCurrentToken()!.type === TokenType.SEMICOLON) {
    this._advance(); // Consume ';'
  }

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.DO_WHILE_STATEMENT,
    body,
    test,
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
 * Helper: Parse loop body (block or single statement)
 */
function _parseLoopBody(this: IParserInternal): IBlockStatementNode | IASTNode {
  if (this._getCurrentToken()!.type === TokenType.LBRACE) {
    return _parseBlockStatement.call(this);
  } else {
    return this._parseStatement();
  }
}

/**
 * Helper: Parse block statement
 */
function _parseBlockStatement(this: IParserInternal): IBlockStatementNode {
  const startToken = this._getCurrentToken();

  // Expect opening brace
  if (this._getCurrentToken()!.type !== TokenType.LBRACE) {
    throw new Error(`Expected '{', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '{'

  const body: IASTNode[] = [];

  while (
    this._getCurrentToken()!.type !== TokenType.RBRACE &&
    this._getCurrentToken()!.type !== TokenType.EOF
  ) {
    body.push(this._parseStatement());
  }

  // Expect closing brace
  if (this._getCurrentToken()!.type !== TokenType.RBRACE) {
    throw new Error(`Expected '}', got ${this._getCurrentToken()!.value}`);
  }

  const endToken = this._getCurrentToken();
  this._advance(); // Consume '}'

  return {
    type: ASTNodeType.BLOCK_STATEMENT,
    body,
    location: {
      start: {
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column + 1,
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
