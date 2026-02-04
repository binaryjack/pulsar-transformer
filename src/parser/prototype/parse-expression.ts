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
import { parseExportDeclaration } from './parse-export-declaration.js';

/**
 * Parse expression
 */
export function parseExpression(this: IParserInternal): any {
  return _parseBinaryExpression.call(this);
}

/**
 * Parse binary expression (handles +, -, *, /, etc.)
 */
function _parseBinaryExpression(this: IParserInternal): any {
  let left = _parsePrimaryExpression.call(this);

  if (!left) return null;

  // Handle binary operators
  while (!this._isAtEnd()) {
    const token = this._getCurrentToken();
    if (!token) break;

    if (
      token.type === 'PLUS' ||
      token.type === 'MINUS' ||
      token.type === 'ASTERISK' ||
      token.type === 'DIVIDE'
    ) {
      const operator = token.value;
      this._advance();
      const right = _parsePrimaryExpression.call(this);

      left = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator,
        left,
        right,
        location: {
          start: left.location.start,
          end: right?.location.end || left.location.end,
        },
      };
    } else {
      break;
    }
  }

  return left;
}

/**
 * Parse primary expression (identifier, literal, call, member access)
 */
function _parsePrimaryExpression(this: IParserInternal): any {
  const token = this._getCurrentToken();

  if (!token) {
    return null;
  }

  // Await expression
  if (token.value === 'await') {
    this._advance();
    const argument = _parsePrimaryExpression.call(this);
    return {
      type: ASTNodeType.AWAIT_EXPRESSION,
      argument,
      location: {
        start: { line: token.line, column: token.column, offset: token.start },
        end: argument?.location.end || {
          line: token.line,
          column: token.column + 5,
          offset: token.end,
        },
      },
    };
  }

  // PSR element: <tag>
  if (token.type === 'LT') {
    return this._parsePSRElement();
  }

  // Signal binding: $(signal)
  if (token.type === 'SIGNAL_BINDING') {
    return this._parsePSRSignalBinding();
  }

  // Arrow function or grouping: () => expr
  if (token.type === 'LPAREN') {
    return this._parseArrowFunctionOrGrouping();
  }

  // Number literal
  if (token.type === 'NUMBER') {
    return this._parseLiteral();
  }

  // String literal
  if (token.type === 'STRING') {
    return this._parseLiteral();
  }

  // Identifier, call expression, or member access
  if (token.type === 'IDENTIFIER') {
    return _parsePostfixExpression.call(this);
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
 * Parse postfix expression (call, member access)
 * Handles: identifier, identifier(), identifier.property, identifier.method()
 */
function _parsePostfixExpression(this: IParserInternal): any {
  const idToken = this._advance();

  const identifier = {
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
          line: endToken!.line,
          column: endToken!.column + 1,
          offset: endToken!.end,
        },
      },
    };
  }

  // Check for member access: identifier.property
  if (this._check('DOT')) {
    return _parseMemberAccess.call(this, identifier);
  }

  // Just identifier
  return identifier;
}

/**
 * Parse member access recursively
 * Handles: obj.prop, obj.prop.nested, obj.method(), obj.prop.method()
 */
function _parseMemberAccess(this: IParserInternal, object: any): any {
  while (this._match('DOT')) {
    const propertyToken = this._expect('IDENTIFIER', 'Expected property name after "."');

    const property = {
      type: ASTNodeType.IDENTIFIER,
      name: propertyToken!.value,
      location: {
        start: {
          line: propertyToken!.line,
          column: propertyToken!.column,
          offset: propertyToken!.start,
        },
        end: {
          line: propertyToken!.line,
          column: propertyToken!.column + propertyToken!.value.length,
          offset: propertyToken!.end,
        },
      },
    };

    // Create member expression
    object = {
      type: ASTNodeType.MEMBER_EXPRESSION,
      object,
      property,
      location: {
        start: object.location.start,
        end: property.location.end,
      },
    };

    // Check for method call: obj.method()
    if (this._check('LPAREN')) {
      this._advance(); // consume (
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

      object = {
        type: ASTNodeType.CALL_EXPRESSION,
        callee: object,
        arguments: args,
        location: {
          start: object.location.start,
          end: {
            line: endToken!.line,
            column: endToken!.column + 1,
            offset: endToken!.end,
          },
        },
      };
    }
  }

  return object;
}

/**
 * Parse arrow function or grouping expression
 */
function _parseArrowFunctionOrGrouping(this: IParserInternal): any {
  const startToken = this._getCurrentToken()!;

  this._expect('LPAREN', 'Expected "("');

  // Check for empty params: ()
  if (this._check('RPAREN')) {
    this._advance(); // consume )

    // Must be arrow function if we see =>
    if (this._match('ARROW')) {
      return _parseArrowFunctionBody.call(this, [], startToken);
    }

    // Empty parens without arrow? Invalid syntax, but return null
    return null;
  }

  // Try to determine if this is arrow function or grouping
  // If first token is IDENTIFIER and followed by , or ), likely arrow function
  // If first token is not IDENTIFIER, it's a grouping expression

  const firstToken = this._getCurrentToken();

  // Grouping expression: (expr)
  if (firstToken && firstToken!.type !== 'IDENTIFIER') {
    const expr = this._parseExpression();
    this._expect('RPAREN', 'Expected ")"');
    return expr;
  }

  // Could be arrow function or grouping
  // Parse as parameters first, save state
  const params: any[] = [];
  // Position tracking removed

  try {
    // Try parsing as arrow function parameters
    do {
      const currentToken = this._getCurrentToken();
      if (!currentToken || currentToken!.type !== 'IDENTIFIER') {
        // Not a parameter list, must be grouping
        // Position restore removed
        const expr = this._parseExpression();
        this._expect('RPAREN', 'Expected ")"');
        return expr;
      }

      const paramToken = currentToken;
      this._advance();

      params.push({
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
      });

      // If we see a comma, continue parsing params
      if (!this._match('COMMA')) {
        break;
      }
    } while (!this._isAtEnd());

    this._expect('RPAREN', 'Expected ")"');

    // Check for arrow: =>
    if (this._match('ARROW')) {
      return _parseArrowFunctionBody.call(this, params, startToken);
    }

    // Not an arrow function, must be grouping
    // But we've already parsed it as params...
    // If single param, return as identifier
    if (params.length === 1) {
      return params[0];
    }

    // Multiple params without arrow? Invalid syntax
    // Return as sequence expression (not standard, but handles edge case)
    return params[0];
  } catch (e) {
    // Failed to parse as arrow function, try as grouping
    // Position restore removed
    const expr = this._parseExpression();
    this._expect('RPAREN', 'Expected ")"');
    return expr;
  }
}

/**
 * Parse arrow function body
 */
function _parseArrowFunctionBody(this: IParserInternal, params: any[], startToken: any): any {
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
      type: 'BlockStatement' as any, // TODO: Add to ASTNodeType enum
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
  };
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
 * Parse export declaration - delegates to dedicated parser
 */
const _parseExportDeclaration = parseExportDeclaration;

// Export helper methods for prototype attachment
export {
  _parseArrowFunctionOrGrouping,
  
  _parseExportDeclaration,
  _parseExpressionStatement,
  _parseLiteral,
};
