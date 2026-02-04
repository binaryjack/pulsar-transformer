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
  const startToken = this.currentToken;

  // Expect 'try'
  if (this.currentToken.type !== TokenType.IDENTIFIER || this.currentToken.value !== 'try') {
    throw new Error(`Expected 'try', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume 'try'

  // Parse try block
  const block = this._parseBlockStatement();

  // Parse catch clause (optional)
  let handler: ICatchClauseNode | null = null;

  if (this.currentToken.type === TokenType.IDENTIFIER && this.currentToken.value === 'catch') {
    const catchStart = this.currentToken;
    this.advance(); // Consume 'catch'

    // Parse parameter (optional in modern TS)
    let param: IIdentifierNode | null = null;

    if (this.currentToken.type === TokenType.PAREN_OPEN) {
      this.advance(); // Consume '('

      if (this.currentToken.type === TokenType.IDENTIFIER) {
        const paramToken = this.currentToken;
        param = {
          type: ASTNodeType.IDENTIFIER,
          name: paramToken.value,
          location: {
            start: {
              line: paramToken.line,
              column: paramToken.column,
              offset: paramToken.start,
            },
            end: {
              line: paramToken.line,
              column: paramToken.column + paramToken.value.length,
              offset: paramToken.end,
            },
          },
        };
        this.advance(); // Consume parameter name
      }

      // Expect closing paren
      if (this.currentToken.type !== TokenType.PAREN_CLOSE) {
        throw new Error(`Expected ')' after catch parameter, got ${this.currentToken.value}`);
      }

      this.advance(); // Consume ')'
    }

    // Parse catch body
    const body = this._parseBlockStatement();

    const catchEnd = this.currentToken;

    handler = {
      type: ASTNodeType.CATCH_CLAUSE,
      param,
      body,
      location: {
        start: {
          line: catchStart.line,
          column: catchStart.column,
          offset: catchStart.start,
        },
        end: {
          line: catchEnd.line,
          column: catchEnd.column,
          offset: catchEnd.end,
        },
      },
    };
  }

  // Parse finally block (optional)
  let finalizer: IBlockStatementNode | null = null;

  if (this.currentToken.type === TokenType.IDENTIFIER && this.currentToken.value === 'finally') {
    this.advance(); // Consume 'finally'
    finalizer = this._parseBlockStatement();
  }

  // Must have at least catch or finally
  if (!handler && !finalizer) {
    throw new Error('Try statement must have at least a catch or finally clause');
  }

  const endToken = this.currentToken;

  // Build location
  const start = {
    line: startToken.line,
    column: startToken.column,
    offset: startToken.start,
  };

  const end = {
    line: endToken.line,
    column: endToken.column,
    offset: endToken.end,
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
  const startToken = this.currentToken;

  // Expect opening brace
  if (this.currentToken.type !== TokenType.BRACE_OPEN) {
    throw new Error(`Expected '{', got ${this.currentToken.value}`);
  }

  this.advance(); // Consume '{'

  // Parse statements
  const body = [];

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
