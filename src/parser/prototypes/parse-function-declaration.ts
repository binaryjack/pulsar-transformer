/**
 * Parser.prototype.parseFunctionDeclaration
 * function name() {} or const fn = () => {}
 * Simplified for arrow functions assigned to const
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IFunctionDeclaration } from '../parser.types.js';

Parser.prototype.parseFunctionDeclaration = function (this: IParser): IFunctionDeclaration {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.FUNCTION);

  // Function name (optional for expressions)
  let id = null;
  if (this.match(TokenTypeEnum.IDENTIFIER)) {
    const nameToken = this.advance();
    id = {
      type: 'Identifier' as const,
      name: nameToken.value,
      start: nameToken.start,
      end: nameToken.end,
    };
  }

  this.expect(TokenTypeEnum.LPAREN);

  // Parameters (simplified)
  const params: any[] = [];
  if (!this.match(TokenTypeEnum.RPAREN)) {
    do {
      const paramToken = this.expect(TokenTypeEnum.IDENTIFIER);
      params.push({
        type: 'Parameter',
        pattern: {
          type: 'Identifier',
          name: paramToken.value,
          start: paramToken.start,
          end: paramToken.end,
        },
        start: paramToken.start,
        end: paramToken.end,
      });

      if (this.match(TokenTypeEnum.COMMA)) {
        this.advance();
      }
    } while (!this.match(TokenTypeEnum.RPAREN));
  }

  this.expect(TokenTypeEnum.RPAREN);

  // Return type (optional)
  let returnType = undefined;
  if (this.match(TokenTypeEnum.COLON)) {
    this.advance();
    const typeToken = this.expect(TokenTypeEnum.IDENTIFIER);
    returnType = {
      type: 'TypeAnnotation' as const,
      typeAnnotation: {
        type: 'TypeReference' as const,
        typeName: {
          type: 'Identifier' as const,
          name: typeToken.value,
          start: typeToken.start,
          end: typeToken.end,
        },
        start: typeToken.start,
        end: typeToken.end,
      },
      start: typeToken.start,
      end: typeToken.end,
    };
  }

  // Body
  const body = this.parseBlockStatement();

  return {
    type: 'FunctionDeclaration',
    id,
    params,
    body,
    returnType,
    async: false,
    start,
    end: body.end,
  };
};
