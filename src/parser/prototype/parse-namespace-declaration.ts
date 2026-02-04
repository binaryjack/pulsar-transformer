import type { IASTNode, INamespaceDeclarationNode } from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parses namespace and module declarations
 * Supports: namespace Utils { }, module Utils { }
 */
export function _parseNamespaceDeclaration(this: IParserInternal): INamespaceDeclarationNode {
  const startToken = this._getCurrentToken();

  // Expect 'namespace' or 'module'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    (this._getCurrentToken()!.value !== 'namespace' && this._getCurrentToken()!.value !== 'module')
  ) {
    throw new Error(`Expected 'namespace' or 'module', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'namespace' or 'module'

  // Parse name (identifier)
  if (this._getCurrentToken()!.type !== TokenType.IDENTIFIER) {
    throw new Error(`Expected namespace name, got ${this._getCurrentToken()!.value}`);
  }

  const name = this._getCurrentToken()!.value;
  this._advance(); // Consume name

  // Expect opening brace
  if (this._getCurrentToken()!.type !== TokenType.LBRACE) {
    throw new Error(`Expected '{' after namespace name, got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '{'

  // Parse body (all declarations inside namespace)
  const body: IASTNode[] = [];

  while (
    this._getCurrentToken()!.type !== TokenType.RBRACE &&
    this._getCurrentToken()!.type !== TokenType.EOF
  ) {
    // Parse each declaration
    const token = this._getCurrentToken();

    if (token!.type === TokenType.IDENTIFIER) {
      // Variable, function, class, interface, enum, namespace, etc.
      if (token!.value === 'var' || token!.value === 'let' || token!.value === 'const') {
        body.push(this._parseVariableDeclaration());
      } else if (token!.value === 'function') {
        body.push(this._parseFunctionDeclaration());
      } else if (token!.value === 'class') {
        body.push(this._parseClassDeclaration());
      } else if (token!.value === 'interface') {
        body.push(this._parseInterfaceDeclaration());
      } else if (token!.value === 'enum') {
        body.push(this._parseEnumDeclaration());
      } else if (token!.value === 'namespace' || token!.value === 'module') {
        // Nested namespace
        body.push(this._parseNamespaceDeclaration());
      } else if (token!.value === 'export') {
        // Skip export keyword and parse next
        this._advance();
        continue;
      } else if (token!.value === 'type') {
        // Type alias - skip for now
        this._skipTypeAlias();
      } else {
        // Unknown - skip
        this._advance();
      }
    } else {
      // Skip unknown tokens
      this._advance();
    }
  }

  // Expect closing brace
  if (this._getCurrentToken()!.type !== TokenType.RBRACE) {
    throw new Error(`Expected '}' to close namespace, got ${this._getCurrentToken()!.value}`);
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
    column: endToken!.column + endToken!.value.length,
    offset: endToken!.end,
  };

  return {
    type: ASTNodeType.NAMESPACE_DECLARATION,
    name: {
      type: ASTNodeType.IDENTIFIER,
      name: name as string,
      location: { start, end },
    } as any,
    body,
    location: {
      start,
      end,
    },
  } as any;
}

/**
 * Helper: Skip type alias declarations
 */
export function _skipTypeAlias(this: IParserInternal): void {
  // Skip 'type'
  this._advance();

  // Skip name
  if (this._getCurrentToken()!.type === TokenType.IDENTIFIER) {
    this._advance();
  }

  // Skip generic parameters
  if (this._getCurrentToken()!.type === TokenType.LT) {
    let depth = 1;
    this._advance();

    while (depth > 0 && this._getCurrentToken()!.type !== TokenType.EOF) {
      if (this._getCurrentToken()!.type === TokenType.LT) {
        depth++;
      } else if (this._getCurrentToken()!.type === TokenType.GT) {
        depth--;
      }
      this._advance();
    }
  }

  // Skip '='
  if (this._getCurrentToken()!.type === TokenType.ASSIGN) {
    this._advance();
  }

  // Skip type definition until semicolon or closing brace
  let depth = 0;
  while (this._getCurrentToken()!.type !== TokenType.EOF) {
    if (
      this._getCurrentToken()!.type === TokenType.LBRACE ||
      this._getCurrentToken()!.type === TokenType.LPAREN ||
      this._getCurrentToken()!.type === TokenType.LBRACKET
    ) {
      depth++;
    } else if (
      this._getCurrentToken()!.type === TokenType.RBRACE ||
      this._getCurrentToken()!.type === TokenType.RPAREN ||
      this._getCurrentToken()!.type === TokenType.RBRACKET
    ) {
      if (depth === 0) {
        break; // Reached end of namespace
      }
      depth--;
    } else if (this._getCurrentToken()!.type === TokenType.SEMICOLON && depth === 0) {
      this._advance(); // Consume semicolon
      break;
    }

    this._advance();
  }
}
