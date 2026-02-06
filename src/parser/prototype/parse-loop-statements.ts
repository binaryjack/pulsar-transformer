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

  // Expect 'for' keyword
  if (!this._check('FOR')) {
    throw new Error(`Expected 'for', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'for'

  // Expect opening paren
  if (this._getCurrentToken()!.type !== TokenType.LPAREN) {
    throw new Error(`Expected '(' after 'for', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '('

  // Parse init (optional)
  // Init can be either a variable declaration (let i = 0) or an expression (i = 0)
  let init: IASTNode | null = null;
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    const currentToken = this._getCurrentToken()!;
    // Check if it's a variable declaration (let/const)
    if (currentToken.type === TokenType.LET || currentToken.type === TokenType.CONST) {
      // Parse variable declaration inline (without consuming semicolon)
      const varStartToken = this._getCurrentToken()!;
      const kind = varStartToken.value as 'const' | 'let';
      this._advance(); // Consume let/const

      // Parse identifier
      const idToken = this._expect('IDENTIFIER', 'Expected identifier in variable declaration');
      const id = {
        type: ASTNodeType.IDENTIFIER,
        name: idToken!.value,
        location: {
          start: {
            line: idToken!.line,
            column: idToken!.column,
            offset: idToken!.start,
          },
          end: {
            line: idToken!.line,
            column: idToken!.column + idToken!.value.length,
            offset: idToken!.end,
          },
        },
      };

      // Parse initializer (optional)
      let varInit: IASTNode | null = null;
      if (this._match('ASSIGN')) {
        varInit = this._parseExpression();
      }

      // Get end position (current token is the one after the init expression/identifier)
      const endToken = this._getCurrentToken()!;

      // Create variable declaration node (don't consume semicolon - for loop needs it)
      init = {
        type: ASTNodeType.VARIABLE_DECLARATION,
        kind,
        declarations: [
          {
            id,
            init: varInit,
          },
        ],
        location: {
          start: {
            line: varStartToken.line,
            column: varStartToken.column,
            offset: varStartToken.start,
          },
          end: {
            line: endToken.line,
            column: endToken.column,
            offset: endToken.start,
          },
        },
      } as any;
    } else {
      // Otherwise parse as expression (supports assignment, calls, etc.)
      init = this._parseExpression();
    }
  }

  // Expect semicolon
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    throw new Error(`Expected ';' after for init, got ${this._getCurrentToken()!.value}`);
  }
  this._advance(); // Consume ';'

  // Parse test (optional)
  let test: IASTNode | null = null;
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    test = this._parseExpression();
  }

  // Expect semicolon
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    throw new Error(`Expected ';' after for test, got ${this._getCurrentToken()!.value}`);
  }
  this._advance(); // Consume ';'

  // Parse update (optional)
  let update: IASTNode | null = null;
  if (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    update = this._parseExpression();
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
  } as any;
}

/**
 * Parses while loop statements
 * Supports: while (test) { }
 */
export function _parseWhileStatement(this: IParserInternal): IWhileStatementNode {
  const startToken = this._getCurrentToken();

  // Expect 'while' keyword
  if (!this._check('WHILE')) {
    throw new Error(`Expected 'while', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'while'

  // Expect opening paren
  if (this._getCurrentToken()!.type !== TokenType.LPAREN) {
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
  } as any;
}

/**
 * Parses do-while loop statements
 * Supports: do { } while (test);
 */
export function _parseDoWhileStatement(this: IParserInternal): IDoWhileStatementNode {
  const startToken = this._getCurrentToken();

  // Expect 'do' keyword
  if (!this._check('DO')) {
    throw new Error(`Expected 'do', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'do'

  // Parse body (must be block statement for AST)
  const body = _parseLoopBody.call(this) as IBlockStatementNode;

  // Expect 'while' keyword
  if (!this._check('WHILE')) {
    throw new Error(`Expected 'while' after do body, got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'while'

  // Expect opening paren
  if (this._getCurrentToken()!.type !== TokenType.LPAREN) {
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
  } as any;
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
export function _parseBlockStatement(this: IParserInternal): IBlockStatementNode {
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
  } as any;
}

/**
 * Helper: Parse simple expression
 */
function _parseSimpleExpression(this: IParserInternal): IASTNode {
  const token = this._getCurrentToken();

  if (token!.type === TokenType.IDENTIFIER) {
    this._advance();
    return {
      type: ASTNodeType.IDENTIFIER,
      name: token!.value,
      location: {
        start: {
          line: token!.line,
          column: token!.column,
          offset: token!.start,
        },
        end: {
          line: token!.line,
          column: token!.column + token!.value.length,
          offset: token!.end,
        },
      },
    } as any;
  }

  if (token!.type === TokenType.NUMBER || token!.type === TokenType.STRING) {
    this._advance();
    return {
      type: ASTNodeType.LITERAL,
      value: token!.value,
      location: {
        start: {
          line: token!.line,
          column: token!.column,
          offset: token!.start,
        },
        end: {
          line: token!.line,
          column: token!.column + token!.value.length,
          offset: token!.end,
        },
      },
    } as any;
  }

  throw new Error(`Unexpected token in expression: ${token!.value}`);
}
