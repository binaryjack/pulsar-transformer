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
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';
import { parseExportDeclaration } from './parse-export-declaration.js';

/**
 * Parse expression
 */
export function parseExpression(this: IParserInternal): any {
  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseExpression: START', {
      currentToken: this._getCurrentToken()?.type,
      tokenValue: this._getCurrentToken()?.value,
      position: this._current,
    });
  }
  const result = _parseConditionalExpression.call(this);
  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseExpression: DONE', {
      resultType: result?.type,
      position: this._current,
    });
  }
  return result;
}

/**
 * Parse binary expression (handles +, -, *, /, etc.)
 */
function _parseConditionalExpression(this: IParserInternal): any {
  let test = _parseLogicalOrExpression.call(this);
  if (!test) return null;

  if (this._match('QUESTION')) {
    const consequent = this._parseExpression();
    this._expect('COLON', 'Expected ":" in conditional expression');
    const alternate = _parseConditionalExpression.call(this);

    const endToken = this._getCurrentToken() || test.location.end;
    return {
      type: ASTNodeType.CONDITIONAL_EXPRESSION,
      test,
      consequent,
      alternate,
      location: {
        start: test.location.start,
        end: alternate?.location?.end || endToken,
      },
    };
  }

  return test;
}

function _parseLogicalOrExpression(this: IParserInternal): any {
  let left = _parseLogicalAndExpression.call(this);
  if (!left) return null;

  while (this._check('OR_OR')) {
    const operator = this._advance().value;
    const right = _parseLogicalAndExpression.call(this);
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
  }

  return left;
}

function _parseLogicalAndExpression(this: IParserInternal): any {
  let left = _parseEqualityExpression.call(this);
  if (!left) return null;

  while (this._check('AND_AND')) {
    const operator = this._advance().value;
    const right = _parseEqualityExpression.call(this);
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
  }

  return left;
}

function _parseEqualityExpression(this: IParserInternal): any {
  let left = _parseRelationalExpression.call(this);
  if (!left) return null;

  while (
    this._check('EQUALS') ||
    this._check('STRICT_EQUALS') ||
    this._check('NOT_EQUALS') ||
    this._check('STRICT_NOT_EQUALS')
  ) {
    const operator = this._advance().value;
    const right = _parseRelationalExpression.call(this);

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
  }

  return left;
}

function _parseRelationalExpression(this: IParserInternal): any {
  let left = _parseAdditiveExpression.call(this);
  if (!left) return null;

  while (
    this._check('LT') ||
    this._check('GT') ||
    this._check('LT_EQUAL') ||
    this._check('GT_EQUAL')
  ) {
    const operator = this._advance().value;
    const right = _parseAdditiveExpression.call(this);
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
  }

  return left;
}

function _parseAdditiveExpression(this: IParserInternal): any {
  let left = _parseMultiplicativeExpression.call(this);
  if (!left) return null;

  while (this._check('PLUS') || this._check('MINUS')) {
    const operator = this._advance().value;
    const right = _parseMultiplicativeExpression.call(this);

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
  }

  return left;
}

function _parseMultiplicativeExpression(this: IParserInternal): any {
  let left = _parseAsExpression.call(this);
  if (!left) return null;

  while (this._check('ASTERISK') || this._check('DIVIDE') || this._check('MODULO')) {
    const operator = this._advance().value;
    const right = _parseAsExpression.call(this);

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
  }

  return left;
}

/**
 * Parse TypeScript 'as' expression (type assertion)
 * Handles: expression as Type
 */
function _parseAsExpression(this: IParserInternal): any {
  let expression = _parsePrimaryExpression.call(this);
  if (!expression) return null;

  // Check for postfix increment/decrement (i++, i--)
  if (this._check('PLUS_PLUS') || this._check('MINUS_MINUS')) {
    const operator = this._getCurrentToken()!;
    this._advance(); // consume ++ or --

    expression = {
      type: ASTNodeType.UPDATE_EXPRESSION,
      operator: operator.value,
      argument: expression,
      prefix: false, // postfix
      location: {
        start: expression.location.start,
        end: {
          line: operator.line,
          column: operator.column + operator.value.length,
          offset: operator.end,
        },
      },
    };
  }

  // Check for 'as' keyword
  if (this._check('AS')) {
    this._advance(); // consume 'as'

    // Parse the type annotation (simplified - just consume the type)
    const typeToken = this._advance();
    if (!typeToken) {
      this._addError({
        code: 'PSR-E003',
        message: 'Expected type after "as"',
        location: {
          line: this._getCurrentToken()?.line || 0,
          column: this._getCurrentToken()?.column || 0,
        },
        token: this._getCurrentToken(),
      });
      return null;
    }

    const typeAnnotation = {
      type: ASTNodeType.IDENTIFIER,
      name: typeToken.value,
      location: {
        start: {
          line: typeToken.line,
          column: typeToken.column,
          offset: typeToken.start,
        },
        end: {
          line: typeToken.line,
          column: typeToken.column + typeToken.value.length,
          offset: typeToken.end,
        },
      },
    };

    return {
      type: ASTNodeType.AS_EXPRESSION,
      expression,
      typeAnnotation,
      location: {
        start: expression.location.start,
        end: typeAnnotation.location.end,
      },
    };
  }

  return expression;
}

/**
 * Parse primary expression (identifier, literal, call, member access)
 */
function _parsePrimaryExpression(this: IParserInternal): any {
  const token = this._getCurrentToken();

  if (this._logger) {
    this._logger.log('parser', 'debug', '_parsePrimaryExpression: START', {
      currentToken: token?.type,
      tokenValue: token?.value,
      position: this._current,
    });
  }

  if (!token) {
    return null;
  }

  // Unary operators: !, -, +, typeof, void, delete
  // Prefix update operators: ++, --
  if (
    token.type === 'EXCLAMATION' ||
    token.type === 'MINUS' ||
    token.type === 'PLUS' ||
    token.type === 'PLUS_PLUS' ||
    token.type === 'MINUS_MINUS' ||
    token.value === 'typeof' ||
    token.value === 'void' ||
    token.value === 'delete'
  ) {
    const operator = this._advance();
    const argument = _parsePrimaryExpression.call(this); // Recursive for chained unary operators

    // Use UPDATE_EXPRESSION for ++ and --
    if (operator.type === 'PLUS_PLUS' || operator.type === 'MINUS_MINUS') {
      return {
        type: ASTNodeType.UPDATE_EXPRESSION,
        operator: operator.value,
        argument,
        prefix: true,
        location: {
          start: {
            line: operator.line,
            column: operator.column,
            offset: operator.start,
          },
          end: argument.location
            ? argument.location.end
            : {
                line: operator.line,
                column: operator.column + operator.value.length,
                offset: operator.end,
              },
        },
      };
    }

    return {
      type: ASTNodeType.UNARY_EXPRESSION,
      operator: operator.value,
      argument,
      location: {
        start: {
          line: operator.line,
          column: operator.column,
          offset: operator.start,
        },
        end: argument
          ? {
              line: argument.location?.end?.line || operator.line,
              column: argument.location?.end?.column || operator.column,
              offset: argument.location?.end?.offset || operator.end,
            }
          : {
              line: operator.line,
              column: operator.column,
              offset: operator.end,
            },
      },
    };
  }

  // Await expression
  if (token.type === TokenType.AWAIT) {
    return this._parseAwaitExpression();
  }

  // Yield expression
  if (token.type === TokenType.YIELD) {
    return this._parseYieldExpression();
  }

  // PSR element: <tag>
  if (token.type === 'LT') {
    if (this._logger) {
      this._logger.log(
        'parser',
        'debug',
        '_parsePrimaryExpression: Detected PSR element (LT token)',
        {
          position: this._current,
          tokenValue: token?.value,
        }
      );
    }
    const result = this._parsePSRElement();
    if (this._logger) {
      this._logger.log('parser', 'debug', '_parsePrimaryExpression: PSR element parsed', {
        resultType: result?.type,
        position: this._current,
      });
    }
    return result;
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

  // Template literal
  if (token.type === 'TEMPLATE_LITERAL' || token.type === 'TEMPLATE_HEAD') {
    return this._parseTemplateLiteral();
  }

  // Object literal: { key: value, ... }
  if (token.type === 'LBRACE') {
    return this._parseObjectLiteral();
  }

  // Array literal: [1, 2, 3]
  if (token.type === 'LBRACKET') {
    return this._parseArrayLiteral();
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
 * Parse template literal - supports embedded expressions
 * Handles: `simple`, `hello ${name}`, `${a} middle ${b} end`
 */
function _parseTemplateLiteral(this: IParserInternal): any {
  const token = this._getCurrentToken();

  if (!token) {
    this._addError({
      code: 'UNEXPECTED_EOF_TEMPLATE',
      message: 'Unexpected end of input while parsing template literal',
      location: {
        line: this._getCurrentToken()?.line || 0,
        column: this._getCurrentToken()?.column || 0,
      },
    });
    return null;
  }

  const startLocation = {
    line: token.line,
    column: token.column,
    offset: token.start,
  };

  // Simple template literal without expressions
  if (token.type === 'TEMPLATE_LITERAL') {
    this._advance();
    return {
      type: ASTNodeType.TEMPLATE_LITERAL,
      quasis: [
        {
          type: ASTNodeType.TEMPLATE_ELEMENT,
          value: {
            cooked: token.value,
            raw: token.value,
          },
          tail: true,
          location: {
            start: startLocation,
            end: {
              line: token.line,
              column: token.column + token.value.length + 2,
              offset: token.end,
            },
          },
        },
      ],
      expressions: [],
      raw: `\`${token.value}\``,
      location: {
        start: startLocation,
        end: {
          line: token.line,
          column: token.column + token.value.length + 2,
          offset: token.end,
        },
      },
    };
  }

  // Template literal with expressions: `hello ${world}`
  const quasis: any[] = [];
  const expressions: any[] = [];

  // Parse TEMPLATE_HEAD: `hello ${
  if (token.type === 'TEMPLATE_HEAD') {
    this._advance();
    quasis.push({
      type: ASTNodeType.TEMPLATE_ELEMENT,
      value: {
        cooked: token.value,
        raw: token.value,
      },
      tail: false,
      location: {
        start: startLocation,
        end: {
          line: token.line,
          column: token.column + token.value.length,
          offset: token.end,
        },
      },
    });

    // Parse embedded expressions and middle/tail parts
    while (!this._isAtEnd()) {
      // Parse expression inside ${}
      const expr = this._parseExpression();
      if (expr) {
        expressions.push(expr);
      }

      // Expect closing brace }
      if (!this._check('RBRACE')) {
        this._addError({
          code: 'EXPECTED_RBRACE_TEMPLATE',
          message: 'Expected "}" in template expression',
          location: {
            line: this._getCurrentToken()?.line || 0,
            column: this._getCurrentToken()?.column || 0,
          },
        });
        break;
      }
      this._advance(); // consume RBRACE

      // After consuming RBRACE, the next token is already the template continuation
      // (TEMPLATE_MIDDLE or TEMPLATE_TAIL) that the lexer automatically generated
      const continuationToken = this._getCurrentToken();

      if (
        !continuationToken ||
        (continuationToken.type !== 'TEMPLATE_MIDDLE' &&
          continuationToken.type !== 'TEMPLATE_TAIL' &&
          continuationToken.type !== 'TEMPLATE_LITERAL')
      ) {
        this._addError({
          code: 'EXPECTED_TEMPLATE_CONTINUATION',
          message: `Expected template continuation after expression, got ${continuationToken?.type || 'EOF'}`,
          location: {
            line: this._getCurrentToken()?.line || 0,
            column: this._getCurrentToken()?.column || 0,
          },
        });
        break;
      }

      // Parse TEMPLATE_MIDDLE: }middle${ or TEMPLATE_TAIL: }end` or TEMPLATE_LITERAL
      if (
        continuationToken.type === 'TEMPLATE_MIDDLE' ||
        continuationToken.type === 'TEMPLATE_LITERAL'
      ) {
        quasis.push({
          type: ASTNodeType.TEMPLATE_ELEMENT,
          value: {
            cooked: continuationToken.value,
            raw: continuationToken.value,
          },
          tail: false,
          location: {
            start: {
              line: continuationToken.line,
              column: continuationToken.column,
              offset: continuationToken.start,
            },
            end: {
              line: continuationToken.line,
              column: continuationToken.column + continuationToken.value.length,
              offset: continuationToken.end,
            },
          },
        });
      } else if (continuationToken.type === 'TEMPLATE_TAIL') {
        quasis.push({
          type: ASTNodeType.TEMPLATE_ELEMENT,
          value: {
            cooked: continuationToken.value,
            raw: continuationToken.value,
          },
          tail: true,
          location: {
            start: {
              line: continuationToken.line,
              column: continuationToken.column,
              offset: continuationToken.start,
            },
            end: {
              line: continuationToken.line,
              column: continuationToken.column + continuationToken.value.length,
              offset: continuationToken.end,
            },
          },
        });
        break; // End of template literal
      } else {
        this._addError({
          code: 'EXPECTED_TEMPLATE_PART',
          message: 'Expected template literal continuation',
          location: {
            line: continuationToken.line || 0,
            column: continuationToken.column || 0,
          },
        });
        break;
      }
    }
  }

  const endToken = this._getCurrentToken() || token;
  return {
    type: ASTNodeType.TEMPLATE_LITERAL,
    quasis,
    expressions,
    location: {
      start: startLocation,
      end: {
        line: endToken.line,
        column: endToken.column,
        offset: endToken.end,
      },
    },
  };
}

/**
 * Parse object literal: { key: value, key2: value2, ...rest }
 */
function _parseObjectLiteral(this: IParserInternal): any {
  let startToken;

  try {
    startToken = this._expect('LBRACE', 'Expected "{"');
  } catch (e) {
    // If this isn't actually an LBRACE, bail out gracefully
    this._addError({
      code: 'PSR-E004',
      message: 'Expected "{" to start object literal',
      location: {
        line: this._getCurrentToken()?.line || 0,
        column: this._getCurrentToken()?.column || 0,
      },
    });
    return null;
  }

  const properties: any[] = [];

  if (!this._check('RBRACE')) {
    do {
      // Check for trailing comma before RBRACE
      if (this._check('RBRACE')) {
        break;
      }

      // Handle spread properties: ...rest
      if (this._check('SPREAD')) {
        this._advance(); // consume ...
        const restToken = this._expect('IDENTIFIER', 'Expected identifier after ...');

        properties.push({
          type: 'SpreadElement',
          argument: {
            type: ASTNodeType.IDENTIFIER,
            name: restToken!.value,
            location: {
              start: {
                line: restToken!.line,
                column: restToken!.column,
                offset: restToken!.start,
              },
              end: {
                line: restToken!.line,
                column: restToken!.column + restToken!.value.length,
                offset: restToken!.end,
              },
            },
          },
        });

        // Spread element must be last
        break;
      }

      // Regular property: key: value
      let keyToken;
      let keyName;

      // Handle identifier keys, string keys, and keyword keys that can be used as identifiers
      if (this._check('IDENTIFIER')) {
        keyToken = this._expect('IDENTIFIER', 'Expected property name');
        keyName = keyToken!.value;
      } else if (this._check('STRING')) {
        keyToken = this._expect('STRING', 'Expected property name');
        // Remove quotes from string literal for the key name
        keyName = keyToken!.value.slice(1, -1); // Remove surrounding quotes
      } else if (this._isKeywordAsIdentifier()) {
        // Allow keywords to be used as object keys (component, const, let, etc.)
        keyToken = this._advance();
        keyName = keyToken!.value;
      } else {
        // Neither identifier nor string nor keyword - this is not a valid object literal
        this._addError({
          code: 'PSR-E002',
          message: 'Expected property name (identifier, string, or keyword) in object literal',
          location: {
            line: this._getCurrentToken()?.line || 0,
            column: this._getCurrentToken()?.column || 0,
          },
          token: this._getCurrentToken(),
        });
        // Skip to end of what we think is the object
        while (!this._isAtEnd() && !this._check('RBRACE') && !this._check('SEMICOLON')) {
          this._advance();
        }
        if (this._check('RBRACE')) {
          this._advance();
        }
        return null;
      }

      // Try to parse the colon, but catch errors gracefully
      try {
        this._expect('COLON', 'Expected ":" after property name');
      } catch (e) {
        this._addError({
          code: 'PSR-E005',
          message: `Expected ":" after property name "${keyName}"`,
          location: {
            line: this._getCurrentToken()?.line || 0,
            column: this._getCurrentToken()?.column || 0,
          },
          token: this._getCurrentToken(),
        });
        // Skip to end of object
        while (!this._isAtEnd() && !this._check('RBRACE') && !this._check('SEMICOLON')) {
          this._advance();
        }
        if (this._check('RBRACE')) {
          this._advance();
        }
        return null;
      }

      const value = this._parseExpression();

      properties.push({
        type: 'Property',
        key: {
          type: ASTNodeType.IDENTIFIER,
          name: keyName,
        },
        value,
        location: {
          start: {
            line: keyToken!.line,
            column: keyToken!.column,
            offset: keyToken!.start,
          },
          end: value
            ? value.location?.end
            : {
                line: keyToken!.line,
                column: keyToken!.column + keyToken!.value.length,
                offset: keyToken!.end,
              },
        },
      });
    } while (this._match('COMMA'));
  }

  let endToken;
  try {
    endToken = this._expect('RBRACE', 'Expected "}" after object properties');
  } catch (e) {
    this._addError({
      code: 'PSR-E006',
      message: 'Expected "}" to close object literal',
      location: {
        line: this._getCurrentToken()?.line || 0,
        column: this._getCurrentToken()?.column || 0,
      },
    });
    return null;
  }

  return {
    type: ASTNodeType.OBJECT_EXPRESSION,
    properties,
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

/**
 * Parse array literal: [1, 2, 3, ...rest]
 */
function _parseArrayLiteral(this: IParserInternal): any {
  const startToken = this._expect('LBRACKET', 'Expected "["');

  const elements: any[] = [];

  if (!this._check('RBRACKET')) {
    do {
      // Handle spread elements: ...rest
      if (this._check('SPREAD')) {
        this._advance(); // consume ...
        const restExpr = this._parseExpression();

        elements.push({
          type: 'SpreadElement',
          argument: restExpr,
        });

        // Spread element can be anywhere in array
      } else {
        // Regular array element
        const element = this._parseExpression();
        elements.push(element);
      }
    } while (this._match('COMMA'));
  }

  const endToken = this._expect('RBRACKET', 'Expected "]" after array elements');

  return {
    type: ASTNodeType.ARRAY_EXPRESSION,
    elements,
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

  // Optional generic type arguments: identifier<T>(args)
  if (_isTypeArgumentListStart.call(this)) {
    _consumeTypeArguments.call(this);
  }

  // Check for call: identifier(args)
  if (this._match('LPAREN')) {
    const args: any[] = [];

    // Parse arguments
    if (!this._check('RPAREN')) {
      let argIndex = 0;
      do {
        let arg = this._parseExpression();

        // Check for single-parameter arrow function: identifier => ...
        if (arg && arg.type === ASTNodeType.IDENTIFIER && this._check('ARROW')) {
          this._advance(); // consume =>
          const body = this._parseExpression(); // parse body
          arg = {
            type: ASTNodeType.ARROW_FUNCTION,
            params: [arg],
            body: body,
            location: {
              start: arg.location.start,
              end: body?.location?.end || arg.location.end,
            },
          };
        }

        if (arg) {
          args.push(arg);
        } else {
          break;
        }
        argIndex++;
      } while (this._match('COMMA'));
    }

    const endToken = this._expect('RPAREN', 'Expected ")" after arguments');

    const callExpression = {
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

    // Check for chained member access after call: identifier().property or identifier()[key]
    if (this._check('DOT') || this._check('LBRACKET')) {
      return _parseMemberAccess.call(this, callExpression);
    }

    return callExpression;
  }

  // Check for member access: identifier.property or identifier[key]
  if (this._check('DOT') || this._check('LBRACKET')) {
    return _parseMemberAccess.call(this, identifier);
  }

  // Just identifier
  return identifier;
}

/**
 * Parse member access recursively
 * Handles: obj.prop, obj[key], obj.prop.nested, obj.method(), obj[key].method()
 */
function _parseMemberAccess(this: IParserInternal, object: any): any {
  while (this._check('DOT') || this._check('LBRACKET')) {
    if (this._match('DOT')) {
      // Handle dot notation: obj.prop
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

      // Create member expression (computed: false for dot notation)
      object = {
        type: ASTNodeType.MEMBER_EXPRESSION,
        object,
        property,
        computed: false,
        location: {
          start: object.location.start,
          end: property.location.end,
        },
      };
    } else if (this._match('LBRACKET')) {
      // Handle bracket notation: obj[key]
      const property = this._parseExpression();
      if (!property) {
        throw new Error('Expected expression inside brackets');
      }

      const endToken = this._expect('RBRACKET', 'Expected "]" after bracket expression');

      // Create member expression (computed: true for bracket notation)
      object = {
        type: ASTNodeType.MEMBER_EXPRESSION,
        object,
        property,
        computed: true,
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

    // Optional generic type arguments: obj.method<T>() or obj[key]<T>()
    if (_isTypeArgumentListStart.call(this)) {
      _consumeTypeArguments.call(this);
    }

    // Check for method call: obj.method() or obj[key]()
    if (this._check('LPAREN')) {
      this._advance(); // consume (
      const args: any[] = [];

      // Parse arguments
      if (!this._check('RPAREN')) {
        let argIndex = 0;
        do {
          let arg = this._parseExpression();

          // Check for single-parameter arrow function: identifier => ...
          if (arg && arg.type === ASTNodeType.IDENTIFIER && this._check('ARROW')) {
            this._advance(); // consume =>
            const body = this._parseExpression(); // parse body
            arg = {
              type: ASTNodeType.ARROW_FUNCTION,
              params: [arg],
              body: body,
              location: {
                start: arg.location.start,
                end: body?.location?.end || arg.location.end,
              },
            };
          }

          if (arg) {
            args.push(arg);
          } else {
            break;
          }
          argIndex++;
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

function _isTypeArgumentListStart(this: IParserInternal): boolean {
  if (!this._check('LT')) {
    return false;
  }

  const currentToken = this._getCurrentToken();

  let depth = 0;
  let offset = 0;
  let closingOffset = -1;
  const MAX_LOOKAHEAD = 100; // Safety limit to prevent infinite loops

  while (offset < MAX_LOOKAHEAD) {
    const token = this._peek(offset);
    if (!token) return false;

    if (token.type === 'LT') {
      depth++;
    } else if (token.type === 'GT') {
      depth--;
      if (depth === 0) {
        closingOffset = offset;
        break;
      }
      // If depth goes negative, this isn't a type argument list
      if (depth < 0) {
        return false;
      }
    } else if (token.type === 'EOF') {
      return false;
    }

    offset++;
  }

  // If we hit the lookahead limit, assume it's not a type argument list
  if (offset >= MAX_LOOKAHEAD) {
    return false;
  }

  const nextToken = this._peek(closingOffset + 1);
  const result = nextToken?.type === 'LPAREN';
  return result;
}

function _consumeTypeArguments(this: IParserInternal): void {
  if (!this._check('LT')) {
    return;
  }

  this._lexer.enterTypeContext(); // PHASE 3: Enable type-aware tokenization

  let depth = 0;
  let consumedCount = 0;
  while (!this._isAtEnd()) {
    const token = this._getCurrentToken();
    if (!token) break;

    if (token.type === 'LT') depth++;
    if (token.type === 'GT') depth--;

    this._advance();
    consumedCount++;

    if (depth === 0) {
      break;
    }
  }

  this._lexer.exitTypeContext(); // PHASE 3: Restore normal tokenization
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
  // If first token is LBRACE or LBRACKET, likely object/array destructuring parameter
  // If first token is not IDENTIFIER/LBRACE/LBRACKET, it's a grouping expression

  const firstToken = this._getCurrentToken();

  // Handle end of input case
  if (!firstToken) {
    this._addError({
      code: 'UNEXPECTED_EOF_ARROW',
      message: 'Unexpected end of input while parsing arrow function parameters',
      location: { line: 0, column: 0 },
    });
    return null;
  }

  // Grouping expression: (expr) - only if NOT destructuring or identifier
  if (
    firstToken.type !== 'IDENTIFIER' &&
    firstToken.type !== 'LBRACE' &&
    firstToken.type !== 'LBRACKET' &&
    firstToken.type !== 'SPREAD'
  ) {
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

      // Check for rest parameter: ...identifier
      if (currentToken?.type === 'SPREAD') {
        this._advance(); // consume ...

        const identToken = this._getCurrentToken();
        if (identToken?.type !== 'IDENTIFIER') {
          throw new Error('Expected identifier after rest operator');
        }

        this._advance(); // consume identifier

        params.push({
          type: 'RestElement',
          argument: {
            type: ASTNodeType.IDENTIFIER,
            name: identToken.value,
            location: {
              start: {
                line: identToken.line,
                column: identToken.column,
                offset: identToken.start,
              },
              end: {
                line: identToken.line,
                column: identToken.column + identToken.value.length,
                offset: identToken.end,
              },
            },
          },
          location: {
            start: {
              line: currentToken.line,
              column: currentToken.column,
              offset: currentToken.start,
            },
            end: {
              line: identToken.line,
              column: identToken.column + identToken.value.length,
              offset: identToken.end,
            },
          },
        });

        // Rest parameter must be last, so break
        break;
      }

      // Handle OBJECT DESTRUCTURING: ({ config, ...rest }) or ({ config }: Type)
      if (currentToken?.type === 'LBRACE') {
        const paramPattern = _parseObjectDestructuringParameter.call(this);
        params.push(paramPattern);

        // Skip type annotation if present: { config }: Type
        if (this._match('COLON')) {
          _skipTypeAnnotation.call(this);
        }

        // Continue if more params
        if (!this._match('COMMA')) {
          break;
        }
        continue;
      }

      // Handle ARRAY DESTRUCTURING: ([a, b]) or ([a, b]: Type)
      if (currentToken?.type === 'LBRACKET') {
        const paramPattern = _parseArrayDestructuringParameter.call(this);
        params.push(paramPattern);

        // Skip type annotation if present: [a, b]: Type
        if (this._match('COLON')) {
          _skipTypeAnnotation.call(this);
        }

        // Continue if more params
        if (!this._match('COMMA')) {
          break;
        }
        continue;
      }

      if (currentToken?.type !== 'IDENTIFIER') {
        // Not a parameter list, must be grouping
        const expr = this._parseExpression();
        this._expect('RPAREN', 'Expected ")"');
        return expr;
      }

      const paramToken = currentToken;

      // Before committing to arrow function parameter parsing,
      // check if the next token is valid for parameters
      // Valid: ), ,, : (for type annotation), or = (for default value)
      // Invalid: operators like ||, &&, +, -, etc.
      const peekToken = this._peek(1); // Look ahead to next token after identifier
      if (
        peekToken &&
        peekToken.type !== 'RPAREN' &&
        peekToken.type !== 'COMMA' &&
        peekToken.type !== 'COLON' &&
        peekToken.type !== 'ASSIGN'
      ) {
        // Not arrow function parameters, parse as grouping expression
        const expr = this._parseExpression();
        this._expect('RPAREN', 'Expected ")"');
        return expr;
      }

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

      // Skip parameter type annotation if present: param: Type
      if (this._match('COLON')) {
        _skipTypeAnnotation.call(this);
      }

      // Handle default value for regular parameter: param = defaultValue
      if (this._match('ASSIGN')) {
        // For now, skip the default value expression
        // TODO: Enhance to properly capture default value in AST
        _skipDefaultValue.call(this);
      }

      // If we see a comma, continue parsing params
      if (!this._match('COMMA')) {
        break;
      }
    } while (!this._isAtEnd());

    this._expect('RPAREN', 'Expected ")"');

    // Skip return type annotation if present: ): Type
    if (this._match('COLON')) {
      _skipReturnTypeAnnotation.call(this);
    }

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
  } catch (error) {
    // Failed to parse as arrow function, parse as grouping expression
    // This handles cases like: (a + b) which are parenthesized expressions, not arrow functions
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Add error for invalid arrow function syntax if it looks like it was intended
    if (errorMessage.includes('arrow') || errorMessage.includes('=>')) {
      this._addError({
        code: 'PSR-E003',
        message: `Invalid arrow function syntax: ${errorMessage}`,
        location: { line: 0, column: 0 },
      });
    }

    // Parse as grouped expression
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

    const currentToken = this._getCurrentToken();
    const startLine = startToken?.line || 0;
    const startCol = startToken?.column || 0;
    const endLine = currentToken?.line || startLine;
    const endCol = currentToken?.column || startCol;

    body = {
      type: ASTNodeType.BLOCK_STATEMENT,
      body: statements,
      location: {
        start: { line: startLine, column: startCol, offset: startToken?.start || 0 },
        end: { line: endLine, column: endCol, offset: currentToken?.end || 0 },
      },
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
  const startToken = this._getCurrentToken()!;
  const expr = this._parseExpression();

  // Consume optional semicolon
  this._match('SEMICOLON');

  const endToken = this._getCurrentToken() || startToken;

  // If expression is a PSR node (fragment, element, component), return it directly (don't wrap in ExpressionStatement)
  if (
    expr &&
    (expr.type === ASTNodeType.PSR_FRAGMENT ||
      expr.type === ASTNodeType.PSR_ELEMENT ||
      expr.type === ASTNodeType.PSR_COMPONENT_REFERENCE)
  ) {
    return expr;
  }

  // Wrap expression in ExpressionStatement
  return {
    type: ASTNodeType.EXPRESSION_STATEMENT,
    expression: expr,
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

/**
 * Parse export declaration - delegates to dedicated parser
 */
const _parseExportDeclaration = parseExportDeclaration;

/**
 * Check if current token is a keyword that can be used as an identifier in object context
 */
function _isKeywordAsIdentifier(this: IParserInternal): boolean {
  const token = this._getCurrentToken();
  if (!token) return false;

  // List of keywords that can be treated as identifiers in object keys
  const allowedKeywords = [
    'COMPONENT',
    'CONST',
    'LET',
    'FUNCTION',
    'CLASS',
    'ASYNC',
    'RETURN',
    'IMPORT',
    'EXPORT',
    'FROM',
    'AS',
    'TYPE',
    'INTERFACE',
    'EXTENDS',
    'ENUM',
    'NAMESPACE',
    'MODULE',
  ];

  return allowedKeywords.includes(token.type);
}

/**
 * Skip TypeScript type annotation in parameter lists or variable declarations
 * Stops at: COMMA (next param), RPAREN (end of params), or LBRACE (function body)
 */
function _skipTypeAnnotation(this: IParserInternal): void {
  let depth = 0;
  while (!this._isAtEnd()) {
    const tok = this._getCurrentToken();

    if (tok?.type === 'LPAREN' || tok?.type === 'LBRACKET' || tok?.type === 'LT') {
      depth++;
    } else if (tok?.type === 'RPAREN' || tok?.type === 'RBRACKET' || tok?.type === 'GT') {
      if (depth === 0) break; // Stop at closing paren of parameter list
      depth--;
    }

    if (depth === 0 && tok?.type === 'COMMA') {
      break; // Stop at comma between parameters
    }

    this._advance();
  }
}

/**
 * Skip default value expression in parameter lists
 * Similar to _skipTypeAnnotation but handles default value expressions
 * Stops at: COMMA (next param), RPAREN (end of params), or RBRACE (end of object pattern)
 */
function _skipDefaultValue(this: IParserInternal): void {
  let depth = 0;
  while (!this._isAtEnd()) {
    const tok = this._getCurrentToken();

    // Track nesting depth for parentheses, brackets, and braces
    if (tok?.type === 'LPAREN' || tok?.type === 'LBRACKET' || tok?.type === 'LBRACE') {
      depth++;
    } else if (tok?.type === 'RPAREN' || tok?.type === 'RBRACKET' || tok?.type === 'RBRACE') {
      if (depth === 0) {
        // At depth 0, stop at closing paren or brace (could be end of pattern)
        break;
      }
      depth--;
    }

    // At depth 0, stop at comma between parameters or properties
    if (depth === 0 && tok?.type === 'COMMA') {
      break;
    }

    this._advance();
  }
}

/**
 * Skip TypeScript return type annotation
 * Stops at: ARROW (=>) or LBRACE (function body)
 */
function _skipReturnTypeAnnotation(this: IParserInternal): void {
  let depth = 0;
  while (!this._isAtEnd()) {
    const tok = this._getCurrentToken();

    // Track depth for nested type structures
    if (tok?.type === 'LPAREN' || tok?.type === 'LBRACKET' || tok?.type === 'LT') {
      depth++;
    } else if (tok?.type === 'RPAREN' || tok?.type === 'RBRACKET' || tok?.type === 'GT') {
      depth--;
      // If we go negative, we've exited the return type scope
      if (depth < 0) break;
    }

    // At depth 0, check if we hit the arrow
    if (depth === 0 && tok?.type === 'ARROW') {
      break;
    }

    // Also stop at statement boundaries when at depth 0
    if (depth === 0 && (tok?.type === 'LBRACE' || tok?.type === 'SEMICOLON')) {
      break;
    }

    this._advance();
  }
}

/**
 * Parse object destructuring parameter: { a, b, ...rest }
 * Returns a pattern node representing the destructuring
 */
function _parseObjectDestructuringParameter(this: IParserInternal): any {
  const startToken = this._getCurrentToken()!;
  this._expect('LBRACE', 'Expected "{"');

  const properties: any[] = [];

  while (!this._check('RBRACE') && !this._isAtEnd()) {
    // Handle rest element: ...rest
    if (this._check('SPREAD')) {
      this._advance(); // consume ...
      const restId = this._expect('IDENTIFIER', 'Expected identifier after ...');
      properties.push({
        type: 'RestElement',
        argument: {
          type: ASTNodeType.IDENTIFIER,
          name: restId!.value,
        },
      });
      break; // rest must be last
    }

    // Regular property
    const key = this._expect('IDENTIFIER', 'Expected property name');
    let value = {
      type: ASTNodeType.IDENTIFIER,
      name: key!.value,
    };

    // Handle renaming: { a: b }
    if (this._check('COLON')) {
      this._advance(); // consume :
      const newName = this._expect('IDENTIFIER', 'Expected identifier after ":"');
      value = {
        type: ASTNodeType.IDENTIFIER,
        name: newName!.value,
      };
    }

    // Handle default value: { a = defaultValue } or { a: b = defaultValue }
    let defaultValue = null;
    if (this._match('ASSIGN')) {
      // Parse the default value expression
      defaultValue = this._parseExpression();
    }

    properties.push({
      type: 'Property',
      key: {
        type: ASTNodeType.IDENTIFIER,
        name: key!.value,
      },
      value: defaultValue
        ? {
            type: 'AssignmentPattern',
            left: value,
            right: defaultValue,
          }
        : value,
      shorthand: key!.value === value.name && !defaultValue,
    });

    if (!this._match('COMMA')) {
      break;
    }
  }

  this._expect('RBRACE', 'Expected "}"');

  return {
    type: 'ObjectPattern',
    properties,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: this._getCurrentToken()!.line,
        column: this._getCurrentToken()!.column,
        offset: this._getCurrentToken()!.end,
      },
    },
  };
}

/**
 * Parse array destructuring parameter: [a, b, ...rest]
 * Returns a pattern node representing the destructuring
 */
function _parseArrayDestructuringParameter(this: IParserInternal): any {
  const startToken = this._getCurrentToken()!;
  this._expect('LBRACKET', 'Expected "["');

  const elements: any[] = [];

  while (!this._check('RBRACKET') && !this._isAtEnd()) {
    // Handle rest element: ...rest
    if (this._check('SPREAD')) {
      this._advance(); // consume ...
      const restId = this._expect('IDENTIFIER', 'Expected identifier after ...');
      elements.push({
        type: 'RestElement',
        argument: {
          type: ASTNodeType.IDENTIFIER,
          name: restId!.value,
        },
      });
      break; // rest must be last
    }

    // Regular element
    const elem = this._expect('IDENTIFIER', 'Expected identifier');

    // Handle default value: [a = defaultValue]
    let element;
    if (this._match('ASSIGN')) {
      // Skip the default value to avoid comma operator confusion
      _skipDefaultValue.call(this);
      element = {
        type: 'AssignmentPattern',
        left: {
          type: ASTNodeType.IDENTIFIER,
          name: elem!.value,
        },
        right: null, // We skip the value to avoid parsing issues
      };
    } else {
      element = {
        type: ASTNodeType.IDENTIFIER,
        name: elem!.value,
      };
    }

    elements.push(element);

    if (!this._match('COMMA')) {
      break;
    }
  }

  this._expect('RBRACKET', 'Expected "]"');

  return {
    type: 'ArrayPattern',
    elements,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: this._getCurrentToken()!.line,
        column: this._getCurrentToken()!.column,
        offset: this._getCurrentToken()!.end,
      },
    },
  };
}

// Export helper methods for prototype attachment
export {
  _isKeywordAsIdentifier,
  _parseArrayLiteral,
  _parseArrowFunctionOrGrouping,
  _parseExportDeclaration,
  _parseExpressionStatement,
  _parseLiteral,
  _parseObjectLiteral,
  _parseTemplateLiteral,
};
