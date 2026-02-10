import type {
  IASTNode,
  IBlockStatementNode,
  IDoWhileStatementNode,
  IForStatementNode,
  IWhileStatementNode,
} from '../ast/ast-node-types.js'
import { ASTNodeType } from '../ast/ast-node-types.js'
import { TokenType } from '../lexer/token-types.js'
import type { IParserInternal } from '../parser.types.js'
import { parseExpression } from './parse-expression.js'

/**
 * Parses for loop statements
 * Supports: for (init; test; update) { }
 */
export function _parseForStatement(this: IParserInternal): IForStatementNode | null {
  const startToken = this._getCurrentToken();
  
  if (!startToken) {
    return null;
  }

  // Expect 'for' keyword
  if (!this._check('FOR')) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected 'for', got ${this._getCurrentToken()?.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: this._getCurrentToken(),
    });
    return null;
  }

  this._advance(); // Consume 'for'

  // Expect opening paren
  const currentToken = this._getCurrentToken();
  if (!currentToken || currentToken.type !== TokenType.LPAREN) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected '(' after 'for', got ${currentToken?.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: currentToken,
    });
    return null;
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
  const semicolon1 = this._getCurrentToken();
  if (!semicolon1 || semicolon1.type !== TokenType.SEMICOLON) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected ';' after for init, got ${semicolon1?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: semicolon1,
    });
    // Try to recover by advancing
    if (semicolon1) this._advance();
  } else {
    this._advance(); // Consume ';'
  }

  // Parse test (optional)
  let test: IASTNode | null = null;
  if (this._getCurrentToken()!.type !== TokenType.SEMICOLON) {
    test = this._parseExpression();
  }

  // Expect semicolon
  const semicolon2 = this._getCurrentToken();
  if (!semicolon2 || semicolon2.type !== TokenType.SEMICOLON) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected ';' after for test, got ${semicolon2?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: semicolon2,
    });
    if (semicolon2) this._advance();
  } else {
    this._advance(); // Consume ';'
  }

  // Parse update (optional)
  let update: IASTNode | null = null;
  if (this._getCurrentToken()!.type !== TokenType.RPAREN) {
    update = this._parseExpression();
  }

  // Expect closing paren
  const closeParen = this._getCurrentToken();
  if (!closeParen || closeParen.type !== TokenType.RPAREN) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected ')' after for header, got ${closeParen?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: closeParen,
    });
    if (closeParen) this._advance();
  } else {
    this._advance(); // Consume ')'
  }

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
export function _parseWhileStatement(this: IParserInternal): IWhileStatementNode | null {
  const startToken = this._getCurrentToken();
  
  if (!startToken) {
    return null;
  }

  // Expect 'while' keyword
  if (!this._check('WHILE')) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected 'while', got ${this._getCurrentToken()?.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: this._getCurrentToken(),
    });
    return null;
  }

  this._advance(); // Consume 'while'

  // Expect opening paren
  const lparen = this._getCurrentToken();
  if (!lparen || lparen.type !== TokenType.LPAREN) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected '(' after 'while', got ${lparen?.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: lparen,
    });
    return null;
  }

  this._advance(); // Consume '('

  // Parse test
  const test = parseExpression.call(this);

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
export function _parseDoWhileStatement(this: IParserInternal): IDoWhileStatementNode | null {
  const startToken = this._getCurrentToken();
  
  if (!startToken) {
    return null;
  }

  // Expect 'do' keyword
  if (!this._check('DO')) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected 'do', got ${this._getCurrentToken()?.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: this._getCurrentToken(),
    });
    return null;
  }

  this._advance(); // Consume 'do'

  // Parse body (must be block statement for AST)
  const body = _parseLoopBody.call(this) as IBlockStatementNode;

  // Expect 'while' keyword
  const whileToken = this._getCurrentToken();
  if (!whileToken || !this._check('WHILE')) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected 'while' after do body, got ${whileToken?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: whileToken,
    });
    return null;
  }

  this._advance(); // Consume 'while'

  // Expect opening paren
  const lparen = this._getCurrentToken();
  if (!lparen || lparen.type !== TokenType.LPAREN) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected '(' after 'while', got ${lparen?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: lparen,
    });
    return null;
  }

  this._advance(); // Consume '('

  // Parse test
  const test = parseExpression.call(this);

  // Expect closing paren
  const rparenWhile = this._getCurrentToken();
  if (!rparenWhile || rparenWhile.type !== TokenType.RPAREN) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected ')' after while test, got ${rparenWhile?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: rparenWhile,
    });
    if (rparenWhile) this._advance();
  } else {
    this._advance(); // Consume ')'
  }

  // Expect semicolon
  if (this._getCurrentToken()?.type === TokenType.SEMICOLON) {
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
export function _parseBlockStatement(this: IParserInternal): IBlockStatementNode | null {
  const startToken = this._getCurrentToken();
  
  if (!startToken) {
    return null;
  }

  // Expect opening brace
  if (startToken.type !== TokenType.LBRACE) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected '{', got ${startToken.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: startToken,
    });
    return null;
  }

  this._advance(); // Consume '{'

  const body: IASTNode[] = [];
  
  // SAFETY: Add position tracking
  let safetyCounter = 0;
  const maxIterations = 50000;

  while (!this._isAtEnd()) {
    const currentToken = this._getCurrentToken();
    if (!currentToken || currentToken.type === TokenType.RBRACE || currentToken.type === TokenType.EOF) {
      break;
    }
    
    if (++safetyCounter > maxIterations) {
      this._addError({
        code: 'PSR-E010',
        message: `Infinite loop detected while parsing block statement (${maxIterations} iterations exceeded)`,
        location: {
          line: currentToken.line,
          column: currentToken.column,
        },
      });
      break;
    }
    
    const beforePos = this._current;
    const statement = this._parseStatement();
    if (statement) {
      body.push(statement);
    }
    
    // SAFETY: Ensure progress
    if (this._current === beforePos) {
      this._addError({
        code: 'PSR-E011',
        message: 'Parser stuck in block statement - forcing advance',
        location: {
          line: currentToken.line,
          column: currentToken.column,
        },
      });
      this._advance();
      break;
    }
  }

  // Expect closing brace
  const closeBrace = this._getCurrentToken();
  if (!closeBrace || closeBrace.type !== TokenType.RBRACE) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected '}', got ${closeBrace?.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: closeBrace,
    });
    // Return what we have so far
  }

  const endToken = this._getCurrentToken() || startToken;
  if (endToken?.type === TokenType.RBRACE) {
    this._advance(); // Consume '}'
  }

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
