/**
 * Parser.prototype.parseExpression
 * Expression parsing with operator precedence (simplified Pratt parser)
 */

import type { IToken } from '../../lexer/lexer.types.js';
import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IExpression } from '../parser.types.js';

// Operator precedence (higher = binds tighter)
const PRECEDENCE: Record<string, number> = {
  [TokenTypeEnum.EQUALS]: 1, // Assignment (lowest precedence, right-associative)
  [TokenTypeEnum.PIPE_PIPE]: 2,
  [TokenTypeEnum.QUESTION_QUESTION]: 2, // ?? (nullish coalescing, same as ||)
  [TokenTypeEnum.AMPERSAND_AMPERSAND]: 3,
  [TokenTypeEnum.PIPE]: 4,
  [TokenTypeEnum.AMPERSAND]: 5,
  [TokenTypeEnum.EQUALS_EQUALS]: 6,
  [TokenTypeEnum.NOT_EQUALS]: 6,
  [TokenTypeEnum.EQUALS_EQUALS_EQUALS]: 6,
  [TokenTypeEnum.NOT_EQUALS_EQUALS]: 6,
  [TokenTypeEnum.LT]: 7,
  [TokenTypeEnum.GT]: 7,
  [TokenTypeEnum.LT_EQUALS]: 7,
  [TokenTypeEnum.GT_EQUALS]: 7,
  [TokenTypeEnum.PLUS]: 8,
  [TokenTypeEnum.MINUS]: 8,
  [TokenTypeEnum.STAR]: 9,
  [TokenTypeEnum.SLASH]: 9,
  [TokenTypeEnum.PERCENT]: 9,
  [TokenTypeEnum.EXPONENTIATION]: 10, // ** has higher precedence than *, /, %
  [TokenTypeEnum.LPAREN]: 11, // Call expression
  [TokenTypeEnum.DOT]: 12, // Member access
  [TokenTypeEnum.LBRACKET]: 12, // Computed member access (same as DOT)
  [TokenTypeEnum.QUESTION_DOT]: 12, // ?. (optional chaining, same as .)
  [TokenTypeEnum.PLUS_PLUS]: 13, // Postfix ++
  [TokenTypeEnum.MINUS_MINUS]: 13, // Postfix --
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

    // Postfix increment/decrement: x++, x--
    if (token.type === TokenTypeEnum.PLUS_PLUS || token.type === TokenTypeEnum.MINUS_MINUS) {
      const operator = this.advance();
      left = {
        type: 'UpdateExpression',
        operator: operator.value,
        argument: left,
        prefix: false,
        start: left.start,
        end: operator.end,
      } as any;
    }
    // Call expression: func()
    else if (token.type === TokenTypeEnum.LPAREN) {
      left = this.parseCallExpression(left);
    }
    // Member expression: obj.prop or obj?.prop (optional chaining)
    else if (token.type === TokenTypeEnum.DOT || token.type === TokenTypeEnum.QUESTION_DOT) {
      const isOptional = token.type === TokenTypeEnum.QUESTION_DOT;
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
        optional: isOptional,
        start: left.start,
        end: property.end,
      } as any;
    }
    // Computed member expression: obj[key] or obj?.[key] (with optional chaining)
    else if (token.type === TokenTypeEnum.LBRACKET) {
      this.advance(); // consume [
      const property = this.parseExpression();
      const endToken = this.expect(TokenTypeEnum.RBRACKET);

      left = {
        type: 'MemberExpression',
        object: left,
        property,
        computed: true,
        optional: false,
        start: left.start,
        end: endToken.end,
      } as any;
    }
    // Assignment expression: a = b (right-associative, lowest precedence)
    else if (token.type === TokenTypeEnum.EQUALS) {
      const operator = this.advance();
      const right = this.parseExpression(getPrecedence(operator.type) - 1); // Right-associative: lower precedence on recursion

      left = {
        type: 'AssignmentExpression',
        left,
        operator: operator.value,
        right,
        start: left.start,
        end: right.end,
      } as any;
    }
    // Binary expression: a + b, a ?? b (nullish coalescing), a ** b (exponentiation)
    else if (PRECEDENCE[token.type]) {
      const operator = this.advance();

      // Exponentiation is right-associative: 2 ** 3 ** 2 = 2 ** (3 ** 2)
      const precedenceAdjustment = operator.type === TokenTypeEnum.EXPONENTIATION ? -1 : 0;
      const right = this.parseExpression(getPrecedence(operator.type) + precedenceAdjustment);

      left = {
        type:
          operator.type === TokenTypeEnum.AMPERSAND_AMPERSAND ||
          operator.type === TokenTypeEnum.PIPE_PIPE ||
          operator.type === TokenTypeEnum.QUESTION_QUESTION
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

  // Arrow function: param => expr (single param without parentheses)
  if (left.type === 'Identifier' && this.match(TokenTypeEnum.ARROW)) {
    const arrowFunc = this.parseArrowFunction([
      {
        type: 'Parameter',
        pattern: left,
        typeAnnotation: null,
        start: left.start,
        end: left.end,
      },
    ]);
    return arrowFunc;
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

  // Identifier or keyword used as identifier
  if (token.type === TokenTypeEnum.IDENTIFIER || this.isKeywordToken(token.type)) {
    const idToken = this.advance();

    return {
      type: 'Identifier',
      name: idToken.value,
      start: idToken.start,
      end: idToken.end,
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

  // Template Literal
  if (token.type === TokenTypeEnum.TEMPLATE_LITERAL) {
    this.advance();
    return this.parseTemplateLiteral(token);
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

  // Prefix increment/decrement: ++x, --x
  if (token.type === TokenTypeEnum.PLUS_PLUS || token.type === TokenTypeEnum.MINUS_MINUS) {
    const operator = this.advance();
    const argument = this.parsePrimaryExpression();

    return {
      type: 'UpdateExpression',
      operator: operator.value,
      argument,
      prefix: true,
      start: operator.start,
      end: argument.end,
    };
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
 * Parse array expression: [1, 2, 3] or [...items, 4]
 */
Parser.prototype.parseArrayExpression = function (this: IParser): IExpression {
  const start = this.peek().start;
  this.expect(TokenTypeEnum.LBRACKET);

  const elements: (IExpression | null)[] = [];

  while (!this.match(TokenTypeEnum.RBRACKET) && !this.isAtEnd()) {
    if (this.match(TokenTypeEnum.COMMA)) {
      elements.push(null as any);
      this.advance();
    } else if (this.match(TokenTypeEnum.SPREAD)) {
      // Spread element: ...items
      const spreadStart = this.advance();
      const argument = this.parseExpression();

      elements.push({
        type: 'SpreadElement',
        argument,
        start: spreadStart.start,
        end: argument.end,
      } as any);

      if (this.match(TokenTypeEnum.COMMA)) {
        this.advance();
      }
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
 * Parse object expression: {key: value} or {'key': value} or {...obj}
 */
Parser.prototype.parseObjectExpression = function (this: IParser): IExpression {
  const start = this.peek().start;
  this.expect(TokenTypeEnum.LBRACE);

  const properties: any[] = [];

  while (!this.match(TokenTypeEnum.RBRACE) && !this.isAtEnd()) {
    // Handle spread properties: {...obj}
    if (this.match(TokenTypeEnum.SPREAD)) {
      const spreadStart = this.advance();
      const argument = this.parseExpression();

      properties.push({
        type: 'SpreadElement',
        argument,
        start: spreadStart.start,
        end: argument.end,
      });

      if (this.match(TokenTypeEnum.COMMA)) {
        this.advance();
      }
      continue;
    }

    // Keys can be identifiers, strings (for kebab-case), OR keywords (like 'component', 'default')
    // Keywords are valid as object keys in JavaScript: {component: Foo, default: true}
    let keyToken: IToken;
    let keyIsString = false;

    if (this.match(TokenTypeEnum.STRING)) {
      keyToken = this.advance();
      keyIsString = true;
    } else if (this.match(TokenTypeEnum.IDENTIFIER)) {
      keyToken = this.advance();
    } else {
      // Accept keywords as object keys (component, default, return, etc.)
      // This handles cases like: {component: Foo} or {default: true}
      const currentToken = this.peek();
      const keywordTokens = [
        TokenTypeEnum.COMPONENT,
        TokenTypeEnum.DEFAULT,
        TokenTypeEnum.RETURN,
        TokenTypeEnum.IMPORT,
        TokenTypeEnum.EXPORT,
        TokenTypeEnum.CONST,
        TokenTypeEnum.LET,
        TokenTypeEnum.VAR,
        TokenTypeEnum.IF,
        TokenTypeEnum.ELSE,
        TokenTypeEnum.FOR,
        TokenTypeEnum.WHILE,
        TokenTypeEnum.FUNCTION,
        TokenTypeEnum.TRUE,
        TokenTypeEnum.FALSE,
        TokenTypeEnum.NULL,
        TokenTypeEnum.UNDEFINED,
      ];

      if (keywordTokens.includes(currentToken.type)) {
        keyToken = this.advance();
      } else {
        // Not a valid object key token - throw error
        keyToken = this.expect(TokenTypeEnum.IDENTIFIER);
      }
    }

    // Shorthand: {key} instead of {key: key} (only valid for identifiers)
    if (!keyIsString && (this.match(TokenTypeEnum.COMMA) || this.match(TokenTypeEnum.RBRACE))) {
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
        key: keyIsString
          ? {
              type: 'Literal',
              value: keyToken.value,
              raw: `"${keyToken.value}"`,
              start: keyToken.start,
              end: keyToken.end,
            }
          : {
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

/**
 * Parse template literal
 * Splits content into quasis (string parts) and expressions
 *
 * Example: `hello ${name}!`
 * → quasis: ["hello ", "!"], expressions: [name]
 */
Parser.prototype.parseTemplateLiteral = function (this: IParser, token: IToken): IExpression {
  const content = token.value;
  const quasis: any[] = [];
  const expressions: IExpression[] = [];

  // DEBUG: Log template literal content
  if (content.includes('product.price') || content.includes('price')) {
    console.log('[TEMPLATE-DEBUG] Parsing template literal:', JSON.stringify(content));
  }

  // If no ${} found, it's a simple template literal
  if (!content.includes('${')) {
    quasis.push({
      type: 'TemplateElement',
      value: {
        cooked: content,
        raw: content,
      },
      tail: true,
      start: token.start,
      end: token.end,
    });

    return {
      type: 'TemplateLiteral',
      quasis,
      expressions: [],
      start: token.start,
      end: token.end,
    };
  }

  // Parse template with expressions
  let pos = 0;
  let depth = 0;

  while (pos < content.length) {
    // Find next ${
    const exprStart = content.indexOf('${', pos);

    if (exprStart === -1) {
      // No more expressions - rest is final quasi
      const tail = content.substring(pos);

      // DEBUG
      if (content.includes('product.price') || content.includes('price')) {
        console.log(`[TEMPLATE-DEBUG] Final quasi:`, JSON.stringify(tail), `(pos=${pos})`);
      }

      quasis.push({
        type: 'TemplateElement',
        value: {
          cooked: tail,
          raw: tail,
        },
        tail: true,
        start: token.start + pos,
        end: token.end,
      });
      break;
    }

    // Add quasi before expression
    const quasi = content.substring(pos, exprStart);

    // DEBUG
    if (content.includes('product.price') || content.includes('price')) {
      console.log(
        `[TEMPLATE-DEBUG] Quasi ${quasis.length}:`,
        JSON.stringify(quasi),
        `(pos=${pos}, exprStart=${exprStart})`
      );
    }

    quasis.push({
      type: 'TemplateElement',
      value: {
        cooked: quasi,
        raw: quasi,
      },
      tail: false,
      start: token.start + pos,
      end: token.start + exprStart,
    });

    // Find matching }
    pos = exprStart + 2; // skip ${
    depth = 1;
    const exprStartPos = pos;

    while (pos < content.length && depth > 0) {
      if (content[pos] === '{') depth++;
      if (content[pos] === '}') depth--;
      if (depth > 0) pos++;
    }

    if (depth !== 0) {
      throw new Error(
        `Unmatched braces in template expression at line ${token.line}, column ${token.column}`
      );
    }

    // Extract and parse the expression
    const exprText = content.substring(exprStartPos, pos);

    // DEBUG
    if (content.includes('product.price') || content.includes('price')) {
      console.log(
        `[TEMPLATE-DEBUG] Expression ${expressions.length}:`,
        JSON.stringify(exprText),
        `(exprStartPos=${exprStartPos}, pos=${pos})`
      );
    }

    // Create a mini-lexer and parser for the expression
    // For simplicity, we'll use a basic identifier parser
    // In a full implementation, we'd recursively parse the expression
    expressions.push({
      type: 'Identifier',
      name: exprText.trim(),
      start: token.start + exprStartPos,
      end: token.start + pos,
    });

    pos++; // skip closing }
  }

  return {
    type: 'TemplateLiteral',
    quasis,
    expressions,
    start: token.start,
    end: token.end,
  };
};
