/**
 * Parser parse method
 *
 * Main entry point - converts PSR source code into AST.
 */

import type { IASTNode, IProgramNode } from '../ast/index.js'
import { ASTNodeType } from '../ast/index.js'
import { TokenType } from '../lexer/token-types.js'
import type { IParserInternal } from '../parser.types.js'

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

  // Tokenize source using instance lexer
  this._tokens = this._lexer.tokenize(source);

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
  if (token.type === TokenType.AT) {
    const decorators: any[] = [];
    while (this._getCurrentToken()?.type === TokenType.AT) {
      const decorator = this._parseDecorator();
      if (decorator) {
        decorators.push(decorator);
      }
    }

    // After decorators, parse the decorated item (class or method)
    const nextToken = this._getCurrentToken();
    if (nextToken?.type === TokenType.CLASS) {
      const classNode = this._parseClassDeclaration() as any;
      if (classNode) {
        classNode.decorators = decorators;
      }
      return classNode;
    }
    // Note: Method decorators are handled in class body parsing
    this._addError({
      code: 'PSR-E001',
      message: `Decorators can only be applied to classes or methods at line ${token.line}`,
      location: { line: token.line, column: token.column },
      token,
    });
    return null;
  }

  // Component declaration
  if (token.type === TokenType.COMPONENT) {
    return this._parseComponentDeclaration();
  }

  // JSX Fragment (<>...</>) or JSX Element (<Component>)
  if (token.type === TokenType.LT) {
    // Check if this is a JSX fragment by looking ahead for GT
    const nextToken = this._peek(1);
    if (nextToken?.type === 'GT') {
      // This is a JSX fragment: <>
      return this._parseJSXFragment();
    }
    // Otherwise, fall through to expression statement for JSX elements
  }

  // Enum declaration (including const enums) - MUST come before variable declaration
  if (token.type === TokenType.ENUM) {
    return this._parseEnumDeclaration();
  }
  if (token.type === TokenType.CONST) {
    const nextToken = this._peek(1);
    if (nextToken?.type === TokenType.ENUM) {
      return this._parseEnumDeclaration();
    }
  }

  // Variable declaration
  if (token.type === TokenType.CONST || token.type === TokenType.LET) {
    return this._parseVariableDeclaration();
  }

  // Function declaration (including async functions)
  if (token.type === TokenType.FUNCTION || token.type === TokenType.ASYNC) {
    return this._parseFunctionDeclaration();
  }

  // Class declaration (including abstract classes)
  if (token.type === TokenType.CLASS || token.type === TokenType.ABSTRACT) {
    return this._parseClassDeclaration();
  }

  // Interface declaration
  if (token.type === TokenType.INTERFACE) {
    return this._parseInterfaceDeclaration();
  }

  // Namespace/Module declaration
  if (token.type === TokenType.NAMESPACE || token.type === TokenType.MODULE) {
    return this._parseNamespaceDeclaration();
  }

  // Type alias declaration
  if (token.type === TokenType.TYPE) {
    return this._parseTypeAlias();
  }

  // Import declaration
  if (token.type === TokenType.IMPORT) {
    return this._parseImportDeclaration();
  }

  // Export declaration
  if (token.type === TokenType.EXPORT) {
    return this._parseExportDeclaration();
  }

  // Return statement
  if (token.type === TokenType.RETURN) {
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

  // If statement
  if (token.type === TokenType.IF) {
    return this._parseIfStatement();
  }

  // Throw statement
  if (token.type === TokenType.THROW) {
    return this._parseThrowStatement();
  }

  // Break statement
  if (token.type === TokenType.BREAK) {
    return this._parseBreakStatement();
  }

  // Continue statement
  if (token.type === TokenType.CONTINUE) {
    return this._parseContinueStatement();
  }

  // Block statement
  if (token.type === TokenType.LBRACE) {
    return this._parseBlockStatement();
  }

  // Expression statement
  return this._parseExpressionStatement();
}

/**
 * Check if at end of tokens
 */
function _isAtEnd(this: IParserInternal): boolean {
  const token = this._getCurrentToken();
  return !token || token.type === TokenType.EOF;
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
  const before = this._tokens[this._current];
  if (!this._isAtEnd()) {
    this._current++;
  }
  const returned = this._tokens[this._current - 1];
  const after = this._tokens[this._current];

  return returned;
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

  if (token?.type !== type) {
    // Enhanced error message with actual token found
    const enhancedMessage = token
      ? `${message} (found ${token.type}: "${token.value}" at line ${token.line}, column ${token.column})`
      : message;

    this._addError({
      code: 'PSR-E001',
      message: enhancedMessage,
      location: token ? { line: token.line, column: token.column } : { line: 0, column: 0 },
      token: token || undefined,
    });
    
    // CRITICAL FIX: Don't throw! Just advance and return the token we got
    // This prevents infinite loops - we ALWAYS make progress
    return this._advance();
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
  _peek
}

