/**
 * Parser.prototype.parseFunctionDeclaration
 * function name() {} or const fn = () => {}
 * Simplified for arrow functions assigned to const
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IFunctionDeclaration } from '../parser.types.js';
import { parseParameterList } from '../strategies/parameter-parsing-strategy.js';

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

  // Parse type parameters if present: function name<T>()
  const typeParameters = this.parseTypeParameters();

  this.expect(TokenTypeEnum.LPAREN);

  // Use shared parameter parsing strategy (eliminates duplication)
  const params = parseParameterList(this);

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
    typeParameters: typeParameters.length > 0 ? typeParameters : undefined,
    params,
    body,
    returnType,
    async: false,
    start,
    end: body.end,
  };
};
