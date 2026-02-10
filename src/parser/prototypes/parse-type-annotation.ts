/**
 * Parser.prototype.parseTypeAnnotation
 * Handles TypeScript type annotations: string,  'literal' | 'union', () => void, etc.
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

/**
 * Parse a TypeScript type annotation
 * Supports:
 * - Simple identifiers: string, number, boolean
 * - String literals: 'primary', 'secondary'
 * - Union types: string | number, 'a' | 'b'
 * - Parenthesized types: (string | number)
 * - Array types: string[]
 * - Function types: () => void
 */
Parser.prototype.parseTypeAnnotation = function (this: IParser): any {
  return this.parseUnionType();
};

/**
 * Parse union type: A | B | C
 */
Parser.prototype.parseUnionType = function (this: IParser): any {
  let type = this.parsePrimaryType();

  // Check for union operator |
  while (this.match(TokenTypeEnum.PIPE)) {
    this.advance(); // consume |

    const right = this.parsePrimaryType();

    type = {
      type: 'UnionType',
      types: type.type === 'UnionType' ? [...type.types, right] : [type, right],
      start: type.start,
      end: right.end,
    };
  }

  return type;
};

/**
 * Parse primary type (before union)
 * - Identifier (string, number, HTMLElement, etc.)
 * - String literal ('primary', 'secondary')
 * - Number literal (not common but possible)
 * - Parenthesized type: (A | B)
 * - Function type: () => ReturnType
 * - Array type handled as suffix: T[]
 */
Parser.prototype.parsePrimaryType = function (this: IParser): any {
  const start = this.peek().start;
  let type: any;

  // String literal type: 'primary'
  if (this.match(TokenTypeEnum.STRING)) {
    const token = this.advance();
    type = {
      type: 'LiteralType',
      literal: {
        type: 'Literal',
        value: token.value,
        start: token.start,
        end: token.end,
      },
      start: token.start,
      end: token.end,
    };
  }
  // Number literal type (rare but valid)
  else if (this.match(TokenTypeEnum.NUMBER)) {
    const token = this.advance();
    type = {
      type: 'LiteralType',
      literal: {
        type: 'Literal',
        value: Number(token.value),
        start: token.start,
        end: token.end,
      },
      start: token.start,
      end: token.end,
    };
  }
  // Keyword literals: true, false, null, undefined
  else if (
    this.match(
      TokenTypeEnum.TRUE,
      TokenTypeEnum.FALSE,
      TokenTypeEnum.NULL,
      TokenTypeEnum.UNDEFINED
    )
  ) {
    const token = this.advance();
    let value: any;
    if (token.type === TokenTypeEnum.TRUE) value = true;
    else if (token.type === TokenTypeEnum.FALSE) value = false;
    else if (token.type === TokenTypeEnum.NULL) value = null;
    else value = undefined;

    type = {
      type: 'LiteralType',
      literal: {
        type: 'Literal',
        value,
        start: token.start,
        end: token.end,
      },
      start: token.start,
      end: token.end,
    };
  }
  // Parenthesized type: (A | B) OR function type: () => T or (a: A) => B
  else if (this.match(TokenTypeEnum.LPAREN)) {
    const startPos = this.peek().start;
    this.advance(); // consume (

    // Check for function type: () => T or (param: Type) => ReturnType
    const savedPos = this.current;
    let isFunctionType = false;

    // Empty params: () => T
    if (this.match(TokenTypeEnum.RPAREN)) {
      const nextPos = this.current + 1;
      if (nextPos < this.tokens.length && this.tokens[nextPos].type === TokenTypeEnum.ARROW) {
        isFunctionType = true;
      }
    }
    // Params: (a: Type) => ReturnType
    // Must have IDENTIFIER followed immediately by COLON (not COMMA, not EQUALS for default values)
    else if (this.match(TokenTypeEnum.IDENTIFIER)) {
      const nextToken = this.tokens[this.current + 1];
      if (nextToken && nextToken.type === TokenTypeEnum.COLON) {
        // Definitely a function type param
        isFunctionType = true;
      }
    }

    if (isFunctionType) {
      // Parse function type
      const params: any[] = [];
      
      while (!this.match(TokenTypeEnum.RPAREN) && !this.isAtEnd()) {
        const paramName = this.expect(TokenTypeEnum.IDENTIFIER);
        this.expect(TokenTypeEnum.COLON);
        const paramType = this.parseTypeAnnotation();
        
        params.push({
          type: 'Parameter',
          name: paramName.value,
          typeAnnotation: paramType,
          start: paramName.start,
          end: paramType.end,
        });

        if (this.match(TokenTypeEnum.COMMA)) {
          this.advance();
        }
      }

      this.expect(TokenTypeEnum.RPAREN);
      this.expect(TokenTypeEnum.ARROW);
      const returnType = this.parseTypeAnnotation();

      type = {
        type: 'FunctionType',
        parameters: params,
        returnType,
        start: startPos,
        end: returnType.end,
      };
    } else {
      // Parenthesized type: (A | B)
      this.current = savedPos;
      type = this.parseTypeAnnotation();
      this.expect(TokenTypeEnum.RPAREN);
    }
  }
  // Identifier type: string, number, HTMLElement, etc.
  else if (this.match(TokenTypeEnum.IDENTIFIER)) {
    const token = this.advance();
    type = {
      type: 'TypeReference',
      typeName: {
        type: 'Identifier',
        name: token.value,
        start: token.start,
        end: token.end,
      },
      start: token.start,
      end: token.end,
    };

    // Check for array suffix: string[]
    while (this.match(TokenTypeEnum.LBRACKET)) {
      this.advance(); // consume [
      this.expect(TokenTypeEnum.RBRACKET); // expect ]
      const endToken = this.tokens[this.current - 1];

      type = {
        type: 'ArrayType',
        elementType: type,
        start: type.start,
        end: endToken.end,
      };
    }
  }
  // Function type: () => ReturnType
  else if (this.match(TokenTypeEnum.LPAREN)) {
    const parenStart = this.advance();

    // Parse parameters (simplified - skip for now)
    // TODO: Parse full parameter list with types
    while (!this.match(TokenTypeEnum.RPAREN) && !this.isAtEnd()) {
      this.advance();
    }

    this.expect(TokenTypeEnum.RPAREN);
    this.expect(TokenTypeEnum.ARROW);

    const returnType = this.parseTypeAnnotation();

    type = {
      type: 'FunctionType',
      parameters: [], // Simplified
      returnType,
      start: parenStart.start,
      end: returnType.end,
    };
  }
  // Fallback: treat as "any" type
  else {
    const token = this.peek();
    type = {
      type: 'TypeReference',
      typeName: {
        type: 'Identifier',
        name: 'any',
        start: token.start,
        end: token.end,
      },
      start: token.start,
      end: token.end,
    };
  }

  return type;
};
