/**
 * Parser.prototype.parseExpression
 * Expression parsing with operator precedence (simplified Pratt parser)
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IExpression } from '../parser.types.js';

// Operator precedence (higher = binds tighter)
const PRECEDENCE: Record<string, number> = {
  [TokenTypeEnum.PIPE_PIPE]: 1,
  [TokenTypeEnum.AMPERSAND_AMPERSAND]: 2,
  [TokenTypeEnum.PIPE]: 3,
  [TokenTypeEnum.AMPERSAND]: 4,
  [TokenTypeEnum.EQUALS_EQUALS]: 5,
  [TokenTypeEnum.NOT_EQUALS]: 5,
  [TokenTypeEnum.EQUALS_EQUALS_EQUALS]: 5,
  [TokenTypeEnum.NOT_EQUALS_EQUALS]: 5,
  [TokenTypeEnum.LT]: 6,
  [TokenTypeEnum.GT]: 6,
  [TokenTypeEnum.PLUS]: 7,
  [TokenTypeEnum.MINUS]: 7,
  [TokenTypeEnum.STAR]: 8,
  [TokenTypeEnum.SLASH]: 8,
  [TokenTypeEnum.PERCENT]: 8,
  [TokenTypeEnum.LPAREN]: 9, // Call expression
  [TokenTypeEnum.DOT]: 10, // Member access
};

function getPrecedence(type: string): number {
  return PRECEDENCE[type] || 0;
}

Parser.prototype.parseExpression = function (this: IParser, precedence: number = 0): IExpression {
  // Parse prefix expression
  let left = this.parsePrimaryExpression();

  // Handle infix operators
  while (precedence < getPrecedence(this.peek().type)) {
    const token = this.peek();

    // Call expression: func()
    if (token.type === TokenTypeEnum.LPAREN) {
      left = this.parseCallExpression(left);
    }
    // Member expression: obj.prop
    else if (token.type === TokenTypeEnum.DOT) {
      this.advance();
      const property = this.expect(TokenTypeEnum.IDENTIFIER);

      left = {
        type: 'MemberExpression',
        object: left,
        property: {
          type: 'Identifier',
          name: property.value,
          start: property.start,
          end: property.end,
        },
        computed: false,
        start: left.start,
        end: property.end,
      };
    }
    // Binary expression: a + b
    else if (PRECEDENCE[token.type]) {
      const operator = this.advance();
      const right = this.parseExpression(getPrecedence(operator.type));

      left = {
        type:
          operator.type === TokenTypeEnum.AMPERSAND_AMPERSAND ||
          operator.type === TokenTypeEnum.PIPE_PIPE
            ? 'LogicalExpression'
            : 'BinaryExpression',
        left,
        operator: operator.value,
        right,
        start: left.start,
        end: right.end,
      } as any;
    } else {
      break;
    }
  }

  // Conditional (ternary) expression: a ? b : c
  if (this.match(TokenTypeEnum.QUESTION)) {
    this.advance();
    const consequent = this.parseExpression();
    this.expect(TokenTypeEnum.COLON);
    const alternate = this.parseExpression();

    return {
      type: 'ConditionalExpression',
      test: left,
      consequent,
      alternate,
      start: left.start,
      end: alternate.end,
    };
  }

  return left;
};

/**
 * Parse primary expressions (literals, identifiers, JSX, etc.)
 */
Parser.prototype.parsePrimaryExpression = function (this: IParser): IExpression {
  const token = this.peek();

  // Identifier
  if (token.type === TokenTypeEnum.IDENTIFIER) {
    this.advance();
    return {
      type: 'Identifier',
      name: token.value,
      start: token.start,
      end: token.end,
    };
  }

  // Number literal
  if (token.type === TokenTypeEnum.NUMBER) {
    this.advance();
    return {
      type: 'Literal',
      value: parseFloat(token.value),
      raw: token.value,
      start: token.start,
      end: token.end,
    };
  }

  // String literal
  if (token.type === TokenTypeEnum.STRING) {
    this.advance();
    return {
      type: 'Literal',
      value: token.value,
      raw: `"${token.value}"`,
      start: token.start,
      end: token.end,
    };
  }

  // Boolean literals
  if (token.type === TokenTypeEnum.TRUE || token.type === TokenTypeEnum.FALSE) {
    this.advance();
    return {
      type: 'Literal',
      value: token.type === TokenTypeEnum.TRUE,
      raw: token.value,
      start: token.start,
      end: token.end,
    };
  }

  // Null
  if (token.type === TokenTypeEnum.NULL) {
    this.advance();
    return {
      type: 'Literal',
      value: null,
      raw: 'null',
      start: token.start,
      end: token.end,
    };
  }

  // Parenthesized expression
  if (token.type === TokenTypeEnum.LPAREN) {
    this.advance();

    // Check for arrow function: () => {} or (): ReturnType => {}
    if (this.match(TokenTypeEnum.RPAREN)) {
      const rparenToken = this.advance();
      
      // Check for return type annotation: (): Type =>
      let returnTypeAnnotation = null;
      if (this.match(TokenTypeEnum.COLON)) {
        this.advance(); // consume :
        returnTypeAnnotation = this.parseTypeAnnotation();
      }
      
      if (this.match(TokenTypeEnum.ARROW)) {
        const arrowFunc = this.parseArrowFunction([]);
        if (returnTypeAnnotation) {
          (arrowFunc as any).returnType = returnTypeAnnotation;
        }
        return arrowFunc;
      }
      
      // Empty parens without arrow? Error
      throw new Error(`Unexpected empty parentheses at line ${token.line}`);
    }

    // Could be arrow function with params or grouped expression
    const savedPos = this.current;
    try {
      // Try parsing arrow function parameters
      const params: any[] = [];
      
      // Handle object destructuring: ({label, variant = 'primary'})
      if (this.match(TokenTypeEnum.LBRACE)) {
        const patternStart = this.peek().start;
        this.advance(); // consume {

        const properties: any[] = [];

        while (!this.match(TokenTypeEnum.RBRACE) && !this.isAtEnd()) {
          const keyToken = this.expect(TokenTypeEnum.IDENTIFIER);

          let defaultValue = null;
          if (this.match(TokenTypeEnum.EQUALS)) {
            this.advance(); // consume =
            // Parse default value
            defaultValue = this.parsePrimaryExpression();
          }

          properties.push({
            type: 'Property',
            key: {
              type: 'Identifier',
              name: keyToken.value,
              start: keyToken.start,
              end: keyToken.end,
            },
            value: {
              type: 'Identifier',
              name: keyToken.value,
              start: keyToken.start,
              end: keyToken.end,
            },
            shorthand: true,
            defaultValue,
            start: keyToken.start,
            end: keyToken.end,
          });

          if (this.match(TokenTypeEnum.COMMA)) {
            this.advance();
          }
        }

        const patternEnd = this.peek().end;
        this.expect(TokenTypeEnum.RBRACE);

        // Check for type annotation: }: IProps
        let typeAnnotation = null;
        if (this.match(TokenTypeEnum.COLON)) {
          this.advance(); // consume :
          typeAnnotation = this.parseTypeAnnotation();
        }

        params.push({
          type: 'Parameter',
          pattern: {
            type: 'ObjectPattern',
            properties,
            start: patternStart,
            end: patternEnd,
          },
          typeAnnotation,
          start: patternStart,
          end: typeAnnotation?.end || patternEnd,
        });

        // MUST expect ) before checking for return type
        if (!this.match(TokenTypeEnum.RPAREN)) {
          throw new Error(
            `Expected ')' after parameter, got '${this.peek().type}' at line ${this.peek().line}`
          );
        }
        
        this.expect(TokenTypeEnum.RPAREN);

        // Check for return type annotation: ): ReturnType
        let returnTypeAnnotation = null;
        if (this.match(TokenTypeEnum.COLON)) {
          this.advance(); // consume :
          returnTypeAnnotation = this.parseTypeAnnotation();
        }

        if (this.match(TokenTypeEnum.ARROW)) {
          const arrowFunc = this.parseArrowFunction(params);
          if (returnTypeAnnotation) {
            (arrowFunc as any).returnType = returnTypeAnnotation;
          }
          return arrowFunc;
        }
        
        // If we got here without arrow, it's not an arrow function
        throw new Error(`Expected '=>' for arrow function at line ${this.peek().line}`);
      }
      // Handle simple parameters: (a, b, c) or (a: Type, b: Type)
      else {
        do {
          const paramToken = this.expect(TokenTypeEnum.IDENTIFIER);
          
          // Check for type annotation: param: Type
          let typeAnnotation = null;
          if (this.match(TokenTypeEnum.COLON)) {
            this.advance(); // consume :
            typeAnnotation = this.parseTypeAnnotation();
          }
          
          params.push({
            type: 'Parameter',
            pattern: {
              type: 'Identifier',
              name: paramToken.value,
              start: paramToken.start,
              end: paramToken.end,
            },
            typeAnnotation,
            start: paramToken.start,
            end: typeAnnotation?.end || paramToken.end,
          });

          if (this.match(TokenTypeEnum.COMMA)) {
            this.advance();
          }
        } while (!this.match(TokenTypeEnum.RPAREN));

        this.expect(TokenTypeEnum.RPAREN);

        if (this.match(TokenTypeEnum.ARROW)) {
          return this.parseArrowFunction(params);
        }
      }
    } catch (err: any) {
      // Not arrow function, reset
    }

    // Grouped expression
    this.current = savedPos;
    const expr = this.parseExpression();
    this.expect(TokenTypeEnum.RPAREN);
    return expr;
  }

  // JSX Element
  if (token.type === TokenTypeEnum.LT) {
    return this.parseJSXElement();
  }

  // Array literal: [1, 2, 3]
  if (token.type === TokenTypeEnum.LBRACKET) {
    return this.parseArrayExpression();
  }

  // Object literal: {key: value}
  if (token.type === TokenTypeEnum.LBRACE) {
    return this.parseObjectExpression();
  }

  // Unary expression: !x, -x
  if (token.type === TokenTypeEnum.EXCLAMATION || token.type === TokenTypeEnum.MINUS) {
    const operator = this.advance();
    const argument = this.parsePrimaryExpression();

    return {
      type: 'UnaryExpression',
      operator: operator.value,
      argument,
      prefix: true,
      start: operator.start,
      end: argument.end,
    };
  }

  throw new Error(`Unexpected token '${token.type}' at line ${token.line}, column ${token.column}`);
};

/**
 * Parse call expression: func()
 */
Parser.prototype.parseCallExpression = function (this: IParser, callee: IExpression): IExpression {
  this.expect(TokenTypeEnum.LPAREN);

  const args: IExpression[] = [];

  if (!this.match(TokenTypeEnum.RPAREN)) {
    do {
      args.push(this.parseExpression());

      if (this.match(TokenTypeEnum.COMMA)) {
        this.advance();
      }
    } while (!this.match(TokenTypeEnum.RPAREN) && !this.isAtEnd());
  }

  const endToken = this.expect(TokenTypeEnum.RPAREN);

  return {
    type: 'CallExpression',
    callee,
    arguments: args,
    start: callee.start,
    end: endToken.end,
  };
};

/**
 * Parse arrow function: () => expr or () => { ... }
 */
Parser.prototype.parseArrowFunction = function (this: IParser, params: any[]): IExpression {
  this.expect(TokenTypeEnum.ARROW);

  let body;
  if (this.match(TokenTypeEnum.LBRACE)) {
    body = this.parseBlockStatement();
  } else {
    body = this.parseExpression();
  }

  return {
    type: 'ArrowFunctionExpression',
    params,
    body,
    async: false,
    start: params[0]?.start || body.start,
    end: body.end,
  };
};

/**
 * Parse array expression: [1, 2, 3]
 */
Parser.prototype.parseArrayExpression = function (this: IParser): IExpression {
  const start = this.peek().start;
  this.expect(TokenTypeEnum.LBRACKET);

  const elements: IExpression[] = [];

  while (!this.match(TokenTypeEnum.RBRACKET) && !this.isAtEnd()) {
    if (this.match(TokenTypeEnum.COMMA)) {
      elements.push(null as any);
      this.advance();
    } else {
      elements.push(this.parseExpression());

      if (this.match(TokenTypeEnum.COMMA)) {
        this.advance();
      }
    }
  }

  const endToken = this.expect(TokenTypeEnum.RBRACKET);

  return {
    type: 'ArrayExpression',
    elements,
    start,
    end: endToken.end,
  };
};

/**
 * Parse object expression: {key: value}
 */
Parser.prototype.parseObjectExpression = function (this: IParser): IExpression {
  const start = this.peek().start;
  this.expect(TokenTypeEnum.LBRACE);

  const properties: any[] = [];

  while (!this.match(TokenTypeEnum.RBRACE) && !this.isAtEnd()) {
    const keyToken = this.expect(TokenTypeEnum.IDENTIFIER);

    // Shorthand: {key} instead of {key: key}
    if (this.match(TokenTypeEnum.COMMA) || this.match(TokenTypeEnum.RBRACE)) {
      properties.push({
        type: 'Property',
        key: {
          type: 'Identifier',
          name: keyToken.value,
          start: keyToken.start,
          end: keyToken.end,
        },
        value: {
          type: 'Identifier',
          name: keyToken.value,
          start: keyToken.start,
          end: keyToken.end,
        },
        computed: false,
        shorthand: true,
        start: keyToken.start,
        end: keyToken.end,
      });
    } else {
      this.expect(TokenTypeEnum.COLON);
      const value = this.parseExpression();

      properties.push({
        type: 'Property',
        key: {
          type: 'Identifier',
          name: keyToken.value,
          start: keyToken.start,
          end: keyToken.end,
        },
        value,
        computed: false,
        shorthand: false,
        start: keyToken.start,
        end: value.end,
      });
    }

    if (this.match(TokenTypeEnum.COMMA)) {
      this.advance();
    }
  }

  const endToken = this.expect(TokenTypeEnum.RBRACE);

  return {
    type: 'ObjectExpression',
    properties,
    start,
    end: endToken.end,
  };
};
