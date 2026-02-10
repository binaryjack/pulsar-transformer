/**
 * Parser.prototype.parseInterfaceDeclaration
 * interface ICounterProps { id?: string; }
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type {
  IIdentifier,
  IInterfaceBody,
  IInterfaceDeclaration,
  IPropertySignature,
} from '../parser.types.js';

Parser.prototype.parseInterfaceDeclaration = function (this: IParser): IInterfaceDeclaration {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.INTERFACE);

  const nameToken = this.expect(TokenTypeEnum.IDENTIFIER);
  const name: IIdentifier = {
    type: 'Identifier',
    name: nameToken.value,
    start: nameToken.start,
    end: nameToken.end,
  };

  this.expect(TokenTypeEnum.LBRACE);

  const properties: IPropertySignature[] = [];

  while (!this.match(TokenTypeEnum.RBRACE) && !this.isAtEnd()) {
    const keyToken = this.expect(TokenTypeEnum.IDENTIFIER);

    const optional = this.match(TokenTypeEnum.QUESTION);
    if (optional) {
      this.advance();
    }

    this.expect(TokenTypeEnum.COLON);

    // Parse type annotation (supports union types, literals, etc.)
    const typeAnnotation = this.parseTypeAnnotation();

    properties.push({
      type: 'PropertySignature',
      key: {
        type: 'Identifier',
        name: keyToken.value,
        start: keyToken.start,
        end: keyToken.end,
      },
      optional,
      typeAnnotation: {
        type: 'TypeAnnotation',
        typeAnnotation,
        start: keyToken.end,
        end: typeAnnotation.end,
      },
      start: keyToken.start,
      end: typeAnnotation.end,
    });

    // Optional semicolon
    if (this.match(TokenTypeEnum.SEMICOLON)) {
      this.advance();
    }
  }

  const endToken = this.expect(TokenTypeEnum.RBRACE);

  const body: IInterfaceBody = {
    type: 'InterfaceBody',
    properties,
    start: nameToken.end,
    end: endToken.end,
  };

  return {
    type: 'InterfaceDeclaration',
    name,
    body,
    start,
    end: endToken.end,
  };
};
