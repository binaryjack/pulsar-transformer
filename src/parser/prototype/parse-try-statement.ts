import type {
  IBlockStatementNode,
  ICatchClauseNode,
  IIdentifierNode,
  ITryStatementNode,
} from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parses try/catch/finally statements
 * Supports: try { } catch (e) { } finally { }
 */
export function _parseTryStatement(this: IParserInternal): ITryStatementNode {
  const startToken = this._getCurrentToken();

  // Expect 'try'
  if (
    this._getCurrentToken()!.type !== TokenType.IDENTIFIER ||
    this._getCurrentToken()!.value !== 'try'
  ) {
    throw new Error(`Expected 'try', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume 'try'

  // Parse try block
  const block = this._parseBlockStatement();

  // Parse catch clause (optional)
  let handler: ICatchClauseNode | null = null;

  if (
    this._getCurrentToken()!.type === TokenType.IDENTIFIER &&
    this._getCurrentToken()!.value === 'catch'
  ) {
    const catchStart = this._getCurrentToken();
    this._advance(); // Consume 'catch'

    // Parse parameter (optional in modern TS)
    let param: IIdentifierNode | null = null;

    if (this._getCurrentToken()!.type === TokenType.LPAREN) {
      this._advance(); // Consume '('

      if (this._getCurrentToken()!.type === TokenType.IDENTIFIER) {
        const paramToken = this._getCurrentToken();
        param = {
          type: ASTNodeType.IDENTIFIER,
          name: paramToken!.value,
          location: {
            start: {
              line: paramToken!.line,
              column: paramToken!.column,
              offset: paramToken!.start,
            },
            end: {
              line: paramToken!.line,
              column: paramToken!.column + paramToken!.value.length,
              offset: paramToken!.end,
            },
          },
        };
        this._advance(); // Consume parameter name
      }

      // Expect closing paren
      if (this._getCurrentToken()!.type !== TokenType.RPAREN) {
        throw new Error(`Expected ')' after catch parameter, got ${this._getCurrentToken()!.value}`);
      }

      this._advance(); // Consume ')'
    }

    // Parse catch body
    const body = this._parseBlockStatement();

    const catchEnd = this._getCurrentToken();

    handler = {
      type: ASTNodeType.CATCH_CLAUSE,
      param,
      body,
      location: {
        start: {
          line: catchStart!.line,
          column: catchStart!.column,
          offset: catchStart!.start,
        },
        end: {
          line: catchEnd!.line,
          column: catchEnd!.column,
          offset: catchEnd!.end,
        },
      },
    };
  }

  // Parse finally block (optional)
  let finalizer: IBlockStatementNode | null = null;

  if (
    this._getCurrentToken()!.type === TokenType.IDENTIFIER &&
    this._getCurrentToken()!.value === 'finally'
  ) {
    this._advance(); // Consume 'finally'
    finalizer = this._parseBlockStatement();
  }

  // Must have at least catch or finally
  if (!handler && !finalizer) {
    throw new Error('Try statement must have at least a catch or finally clause');
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
    type: ASTNodeType.TRY_STATEMENT,
    block,
    handler,
    finalizer,
    location: {
      start,
      end,
    },
  };
}

/**
 * Helper: Parse block statement { ... }
 */
function _parseBlockStatement(this: IParserInternal): IBlockStatementNode {
  const startToken = this._getCurrentToken();

  // Expect opening brace
  if (this._getCurrentToken()!.type !== TokenType.LBRACE) {
    throw new Error(`Expected '{', got ${this._getCurrentToken()!.value}`);
  }

  this._advance(); // Consume '{'

  // Parse statements
  const body = [];

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

