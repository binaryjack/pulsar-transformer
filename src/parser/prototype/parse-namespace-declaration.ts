import type { IASTNode, INamespaceDeclarationNode } from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parses namespace and module declarations
 * Supports: namespace Utils { }, module Utils { }
 */
export function _parseNamespaceDeclaration(this: IParserInternal): INamespaceDeclarationNode {
  const startToken = this.currentToken;

  // Expect 'namespace' or 'module'
  if (
    this.currentToken.type !== TokenType.IDENTIFIER ||
    (this.currentToken.value !== 'namespace' && this.currentToken.value !== 'module')
  ) {
    throw new Error(`Expected 'namespace' or 'module', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'namespace' or 'module'

  // Parse name (identifier)
  if (this.currentToken.type !== TokenType.IDENTIFIER) {
    throw new Error(`Expected namespace name, got ${this.currentToken.value}`);
  }

  const name = this.currentToken.value;
  this.advance(); // Consume name

  // Expect opening brace
  if (this.currentToken.type !== TokenType.BRACE_OPEN) {
    throw new Error(`Expected '{' after namespace name, got ${this.currentToken.value}`);
  }

  this.advance(); // Consume '{'

  // Parse body (all declarations inside namespace)
  const body: IASTNode[] = [];

  while (
    this.currentToken.type !== TokenType.BRACE_CLOSE &&
    this.currentToken.type !== TokenType.EOF
  ) {
    // Parse each declaration
    const token = this.currentToken;

    if (token.type === TokenType.IDENTIFIER) {
      // Variable, function, class, interface, enum, namespace, etc.
      if (token.value === 'var' || token.value === 'let' || token.value === 'const') {
        body.push(this._parseVariableDeclaration());
      } else if (token.value === 'function') {
        body.push(this._parseFunctionDeclaration());
      } else if (token.value === 'class') {
        body.push(this._parseClassDeclaration());
      } else if (token.value === 'interface') {
        body.push(this._parseInterfaceDeclaration());
      } else if (token.value === 'enum') {
        body.push(this._parseEnumDeclaration());
      } else if (token.value === 'namespace' || token.value === 'module') {
        // Nested namespace
        body.push(this._parseNamespaceDeclaration());
      } else if (token.value === 'export') {
        // Skip export keyword and parse next
        this.advance();
        continue;
      } else if (token.value === 'type') {
        // Type alias - skip for now
        this._skipTypeAlias();
      } else {
        // Unknown - skip
        this.advance();
      }
    } else {
      // Skip unknown tokens
      this.advance();
    }
  }

  // Expect closing brace
  if (this.currentToken.type !== TokenType.BRACE_CLOSE) {
    throw new Error(`Expected '}' to close namespace, got ${this.currentToken.value}`);
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
    column: endToken.column + endToken.value.length,
    offset: endToken.end,
  };

  return {
    type: ASTNodeType.NAMESPACE_DECLARATION,
    name,
    body,
    location: {
      start,
      end,
    },
  };
}

/**
 * Helper: Skip type alias declarations
 */
function _skipTypeAlias(this: IParserInternal): void {
  // Skip 'type'
  this.advance();

  // Skip name
  if (this.currentToken.type === TokenType.IDENTIFIER) {
    this.advance();
  }

  // Skip generic parameters
  if (this.currentToken.type === TokenType.LESS_THAN) {
    let depth = 1;
    this.advance();

    while (depth > 0 && this.currentToken.type !== TokenType.EOF) {
      if (this.currentToken.type === TokenType.LESS_THAN) {
        depth++;
      } else if (this.currentToken.type === TokenType.GREATER_THAN) {
        depth--;
      }
      this.advance();
    }
  }

  // Skip '='
  if (this.currentToken.type === TokenType.EQUALS) {
    this.advance();
  }

  // Skip type definition until semicolon or closing brace
  let depth = 0;
  while (this.currentToken.type !== TokenType.EOF) {
    if (
      this.currentToken.type === TokenType.BRACE_OPEN ||
      this.currentToken.type === TokenType.PAREN_OPEN ||
      this.currentToken.type === TokenType.BRACKET_OPEN
    ) {
      depth++;
    } else if (
      this.currentToken.type === TokenType.BRACE_CLOSE ||
      this.currentToken.type === TokenType.PAREN_CLOSE ||
      this.currentToken.type === TokenType.BRACKET_CLOSE
    ) {
      if (depth === 0) {
        break; // Reached end of namespace
      }
      depth--;
    } else if (this.currentToken.type === TokenType.SEMICOLON && depth === 0) {
      this.advance(); // Consume semicolon
      break;
    }

    this.advance();
  }
}
