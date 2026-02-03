/**
 * Parse Expression
 *
 * Parses various expression types (call, arrow function, literals, etc.).
 *
 * @example
 * createSignal(0)
 * () => handle()
 * 42
 * "hello"
 */

import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse expression
 */
export function parseExpression(this: IParserInternal): any {
  const token = this._getCurrentToken();

  if (!token) {
    return null;
  }

  // PSR element: <tag>
  if (token.type === 'LT') {
    return this._parsePSRElement();
  }

  // Signal binding: $(signal)
  if (token.type === 'SIGNAL_BINDING') {
    return this._parsePSRSignalBinding();
  }

  // Arrow function: () => expr
  if (token.type === 'LPAREN') {
    return this._parseArrowFunctionOrGrouping();
  }

  // Call expression or identifier
  if (token.type === 'IDENTIFIER') {
    return this._parseCallOrIdentifier();
  }

  // Number literal
  if (token.type === 'NUMBER') {
    return this._parseLiteral();
  }

  // String literal
  if (token.type === 'STRING') {
    return this._parseLiteral();
  }

  // Unknown expression - skip
  this._advance();
  return null;
}

/**
 * Parse literal (number or string)
 */
function _parseLiteral(this: IParserInternal): any {
  const token = this._advance();

  return {
    type: ASTNodeType.LITERAL,
    value: token.type === 'NUMBER' ? Number(token.value) : token.value,
    raw: token.value,
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

/**
 * Parse call expression or identifier
 */
function _parseCallOrIdentifier(this: IParserInternal): any {
  const idToken = this._advance();

  const identifier = {
    type: ASTNodeType.IDENTIFIER,
    name: idToken.value,
    location: {
      start: {
        line: idToken.line,
        column: idToken.column,
        offset: idToken.start,
      },
      end: {
        line: idToken.line,
        column: idToken.column + idToken.value.length,
        offset: idToken.end,
      },
    },
  };

  // Check for call: identifier(args)
  if (this._match('LPAREN')) {
    const args: any[] = [];

    // Parse arguments
    if (!this._check('RPAREN')) {
      do {
        const arg = this._parseExpression();
        if (arg) {
          args.push(arg);
        }
      } while (this._match('COMMA'));
    }

    const endToken = this._expect('RPAREN', 'Expected ")" after arguments');

    return {
      type: ASTNodeType.CALL_EXPRESSION,
      callee: identifier,
      arguments: args,
      location: {
        start: identifier.location.start,
        end: {
          line: endToken.line,
          column: endToken.column + 1,
          offset: endToken.end,
        },
      },
    };
  }

  // Just identifier
  return identifier;
}

/**
 * Parse arrow function or grouping expression
 */
function _parseArrowFunctionOrGrouping(this: IParserInternal): any {
  const startToken = this._getCurrentToken()!;

  this._expect('LPAREN', 'Expected "("');

  const params: any[] = [];

  // Parse parameters
  if (!this._check('RPAREN')) {
    do {
      const paramToken = this._expect('IDENTIFIER', 'Expected parameter name');
      params.push({
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
      });
    } while (this._match('COMMA'));
  }

  this._expect('RPAREN', 'Expected ")"');

  // Check for arrow: =>
  if (this._match('ARROW')) {
    // Arrow function body
    let body: any;

    if (this._match('LBRACE')) {
      // Block body: () => { ... }
      const statements: any[] = [];

      while (!this._check('RBRACE') && !this._isAtEnd()) {
        const stmt = this._parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      }

      this._expect('RBRACE', 'Expected "}"');

      body = {
        type: ASTNodeType.BLOCK_STATEMENT,
        body: statements,
      };
    } else {
      // Expression body: () => expr
      body = this._parseExpression();
    }

    const endToken = this._getCurrentToken() || startToken;

    return {
      type: ASTNodeType.ARROW_FUNCTION,
      params,
      body,
      location: {
        start: {
          line: startToken.line,
          column: startToken.column,
          offset: startToken.start,
        },
        end: {
          line: endToken.line,
          column: endToken.column,
          offset: endToken.end,
        },
      },
    };
  }

  // Grouping expression: (expr)
  if (params.length === 1) {
    return params[0];
  }

  // Error
  this._addError({
    code: 'PSR-E005',
    message: 'Unexpected expression',
    location: { line: startToken.line, column: startToken.column },
    token: startToken,
  });

  return null;
}

/**
 * Parse expression statement
 */
function _parseExpressionStatement(this: IParserInternal): any {
  const expr = this._parseExpression();
  this._match('SEMICOLON');
  return expr;
}

/**
 * Parse import declaration (stub - not implemented yet)
 */
function _parseImportDeclaration(this: IParserInternal): any {
  const startToken = this._advance(); // consume 'import'

  // Stub implementation - skip to semicolon
  while (!this._check('SEMICOLON') && !this._isAtEnd()) {
    this._advance();
  }
  this._match('SEMICOLON');

  return {
    type: ASTNodeType.IMPORT_DECLARATION,
    source: '',
    specifiers: [],
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.end,
      },
    },
  };
}

/**
 * Parse export declaration (stub - not implemented yet)
 */
function _parseExportDeclaration(this: IParserInternal): any {
  const startToken = this._advance(); // consume 'export'

  // Parse exported declaration
  const declaration = this._parseStatement();

  return {
    type: ASTNodeType.EXPORT_DECLARATION,
    declaration,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: declaration?.location?.end || {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.end,
      },
    },
  };
}

// Export helper methods for prototype attachment
export {
  _parseArrowFunctionOrGrouping,
  _parseCallOrIdentifier,
  _parseExportDeclaration,
  _parseExpressionStatement,
  _parseImportDeclaration,
  _parseLiteral,
};
