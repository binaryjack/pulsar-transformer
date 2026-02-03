/**
 * Parser parse method
 *
 * Main entry point - converts PSR source code into AST.
 */

import type { IASTNode, IProgramNode } from '../ast';
import { ASTNodeType } from '../ast';
import { createLexer } from '../lexer';
import type { IParserInternal } from '../parser.types';

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

  // Component declaration
  if (token.value === 'component') {
    return this._parseComponentDeclaration();
  }

  // Variable declaration
  if (token.value === 'const' || token.value === 'let') {
    return this._parseVariableDeclaration();
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
};
