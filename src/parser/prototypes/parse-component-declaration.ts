/**
 * Parser.prototype.parseComponentDeclaration
 * component Counter({id}: ICounterProps) { ... }
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type {
  IComponentDeclaration,
  IParameter,
  IPattern,
  ITypeAnnotation,
} from '../parser.types.js';

Parser.prototype.parseComponentDeclaration = function (this: IParser): IComponentDeclaration {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.COMPONENT);

  const nameToken = this.expect(TokenTypeEnum.IDENTIFIER);

  this.expect(TokenTypeEnum.LPAREN);

  // Parse parameters
  const params: IParameter[] = [];

  if (!this.match(TokenTypeEnum.RPAREN)) {
    do {
      // Parse parameter pattern (can be identifier or destructuring)
      let pattern: IPattern;

      if (this.match(TokenTypeEnum.LBRACE)) {
        // Object destructuring: {id}
        const patternStart = this.peek().start;
        this.advance();

        const properties: any[] = [];

        while (!this.match(TokenTypeEnum.RBRACE) && !this.isAtEnd()) {
          const keyToken = this.expect(TokenTypeEnum.IDENTIFIER);

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
            start: keyToken.start,
            end: keyToken.end,
          });

          if (this.match(TokenTypeEnum.COMMA)) {
            this.advance();
          }
        }

        const patternEnd = this.peek().end;
        this.expect(TokenTypeEnum.RBRACE);

        pattern = {
          type: 'ObjectPattern',
          properties,
          start: patternStart,
          end: patternEnd,
        };
      } else {
        // Simple identifier
        const idToken = this.expect(TokenTypeEnum.IDENTIFIER);
        pattern = {
          type: 'Identifier',
          name: idToken.value,
          start: idToken.start,
          end: idToken.end,
        };
      }

      // Type annotation
      let typeAnnotation = undefined;
      if (this.match(TokenTypeEnum.COLON)) {
        this.advance();
        const typeToken = this.expect(TokenTypeEnum.IDENTIFIER);

        typeAnnotation = {
          type: 'TypeAnnotation',
          typeAnnotation: {
            type: 'TypeReference',
            typeName: {
              type: 'Identifier',
              name: typeToken.value,
              start: typeToken.start,
              end: typeToken.end,
            },
            start: typeToken.start,
            end: typeToken.end,
          },
          start: typeToken.start,
          end: typeToken.end,
        } satisfies ITypeAnnotation;
      }

      params.push({
        type: 'Parameter',
        pattern,
        typeAnnotation,
        start: pattern.start,
        end: typeAnnotation?.end || pattern.end,
      });

      if (this.match(TokenTypeEnum.COMMA)) {
        this.advance();
      }
    } while (!this.match(TokenTypeEnum.RPAREN) && !this.isAtEnd());
  }

  this.expect(TokenTypeEnum.RPAREN);

  // Parse body
  const body = this.parseBlockStatement();

  return {
    type: 'ComponentDeclaration',
    name: {
      type: 'Identifier',
      name: nameToken.value,
      start: nameToken.start,
      end: nameToken.end,
    },
    params,
    body,
    exported: false,
    start,
    end: body.end,
  };
};
