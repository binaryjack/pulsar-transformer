/**
 * Parser parse method
 *
 * Main entry point - converts PSR source code into AST.
 */

import type { IASTNode, IProgramNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import { createLexer } from '../lexer/index.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse PSR source code into AST
 *
 * @param source - PSR source code
 * @returns AST root node (Program)
 */
export function parse(this: IParserInternal, source: string): IASTNode {
  // Reset internal state
  this._source = source;
  this._current = 0;
  this._errors = [];

  // Tokenize source
  const lexer = createLexer();
  this._tokens = lexer.tokenize(source);

  // Parse program (root node)
  const body: IASTNode[] = [];

  while (!this._isAtEnd()) {
    const statement = this._parseStatement();
    if (statement) {
      body.push(statement);
    }
  }

  const program: IProgramNode = {
    type: ASTNodeType.PROGRAM,
    body,
    location: {
      start: { line: 1, column: 1, offset: 0 },
      end: this._getCurrentToken()
        ? {
            line: this._getCurrentToken()!.line,
            column: this._getCurrentToken()!.column,
            offset: this._getCurrentToken()!.end,
          }
        : { line: 1, column: 1, offset: 0 },
    },
  };

  return program;
}

/**
 * Parse a statement
 */
function _parseStatement(this: IParserInternal): IASTNode | null {
  const token = this._getCurrentToken();

  if (!token) {
    return null;
  }

  // Decorator (@) - parse decorators and continue to decorated item
  if (token.type === 'AT') {
    const decorators: any[] = [];
    while (this._getCurrentToken()?.type === 'AT') {
      decorators.push(this._parseDecorator());
    }

    // After decorators, parse the decorated item (class or method)
    const nextToken = this._getCurrentToken();
    if (nextToken?.value === 'class' || nextToken?.value === 'abstract') {
      const classNode = this._parseClassDeclaration() as any;
      classNode.decorators = decorators;
      return classNode;
    }
    // Note: Method decorators are handled in class body parsing
    throw new Error(`Decorators can only be applied to classes or methods at line ${token.line}`);
  }

  // Component declaration
  if (token.value === 'component') {
    return this._parseComponentDeclaration();
  }

  // Enum declaration (including const enums) - MUST come before variable declaration
  if (token.value === 'enum') {
    return this._parseEnumDeclaration();
  }
  if (token.value === 'const') {
    const nextToken = this._peek(1);
    if (nextToken?.value === 'enum') {
      return this._parseEnumDeclaration();
    }
  }

  // Variable declaration
  if (token.value === 'const' || token.value === 'let') {
    return this._parseVariableDeclaration();
  }

  // Function declaration (including async functions)
  if (token.value === 'function' || token.value === 'async') {
    return this._parseFunctionDeclaration();
  }

  // Class declaration (including abstract classes)
  if (token.value === 'class' || token.value === 'abstract') {
    return this._parseClassDeclaration();
  }

  // Interface declaration
  if (token.value === 'interface') {
    return this._parseInterfaceDeclaration();
  }

  // Namespace/Module declaration
  if (token.type === TokenType.NAMESPACE || token.type === TokenType.MODULE) {
    return this._parseNamespaceDeclaration();
  }

  // Type alias declaration
  if (token.value === 'type') {
    return this._parseTypeAlias();
  }

  // Import declaration
  if (token.value === 'import') {
    return this._parseImportDeclaration();
  }

  // Export declaration
  if (token.value === 'export') {
    return this._parseExportDeclaration();
  }

  // Return statement
  if (token.value === 'return') {
    return this._parseReturnStatement();
  }

  // Try/catch/finally statement
  if (token.type === TokenType.TRY) {
    return this._parseTryStatement();
  }

  // Switch statement
  if (token.type === TokenType.SWITCH) {
    return this._parseSwitchStatement();
  }

  // For loop
  if (token.type === TokenType.FOR) {
    return this._parseForStatement();
  }

  // While loop
  if (token.type === TokenType.WHILE) {
    return this._parseWhileStatement();
  }

  // Do-while loop
  if (token.type === TokenType.DO) {
    return this._parseDoWhileStatement();
  }

  // Throw statement
  if (token.value === 'throw') {
    return this._parseThrowStatement();
  }

  // Switch statement
  if (token.value === 'switch') {
    return this._parseSwitchStatement();
  }

  // For loop
  if (token.value === 'for') {
    return this._parseForStatement();
  }

  // While loop
  if (token.value === 'while') {
    return this._parseWhileStatement();
  }

  // Do-while loop
  if (token.value === 'do') {
    return this._parseDoWhileStatement();
  }

  // Break statement
  if (token.value === 'break') {
    return this._parseBreakStatement();
  }

  // Continue statement
  if (token.value === 'continue') {
    return this._parseContinueStatement();
  }

  // Expression statement
  return this._parseExpressionStatement();
}

/**
 * Check if at end of tokens
 */
function _isAtEnd(this: IParserInternal): boolean {
  const token = this._getCurrentToken();
  return !token || token.type === 'EOF';
}

/**
 * Get current token without consuming
 */
function _getCurrentToken(this: IParserInternal) {
  return this._tokens[this._current] || null;
}

/**
 * Peek at token ahead by offset without consuming
 */
function _peek(this: IParserInternal, offset: number = 0) {
  return this._tokens[this._current + offset] || null;
}

/**
 * Advance to next token
 */
function _advance(this: IParserInternal) {
  if (!this._isAtEnd()) {
    this._current++;
  }
  return this._tokens[this._current - 1];
}

/**
 * Check if current token matches type
 */
function _check(this: IParserInternal, type: string): boolean {
  const token = this._getCurrentToken();
  return token ? token.type === type : false;
}

/**
 * Match and consume token if it matches
 */
function _match(this: IParserInternal, ...types: string[]): boolean {
  for (const type of types) {
    if (this._check(type)) {
      this._advance();
      return true;
    }
  }
  return false;
}

/**
 * Expect token type or throw error
 */
function _expect(this: IParserInternal, type: string, message: string) {
  const token = this._getCurrentToken();

  if (!token || token.type !== type) {
    this._addError({
      code: 'PSR-E001',
      message,
      location: token ? { line: token.line, column: token.column } : { line: 0, column: 0 },
      token: token || undefined,
    });
    throw new Error(message);
  }

  return this._advance();
}

/**
 * Add parsing error
 */
function _addError(
  this: IParserInternal,
  error: {
    code: string;
    message: string;
    location: { line: number; column: number };
    token?: any;
  }
) {
  this._errors.push(error);
}

// Export private helper methods for prototype attachment
export {
  _addError,
  _advance,
  _check,
  _expect,
  _getCurrentToken,
  _isAtEnd,
  _match,
  _parseStatement,
  _peek,
};
