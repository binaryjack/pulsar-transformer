/**
 * Parser.prototype.parseComponentDeclaration
 * component Counter({id}: ICounterProps) { ... }
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IComponentDeclaration } from '../parser.types.js';
import { parseParameterList } from '../strategies/parameter-parsing-strategy.js';

Parser.prototype.parseComponentDeclaration = function (this: IParser): IComponentDeclaration {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.COMPONENT);

  const nameToken = this.expect(TokenTypeEnum.IDENTIFIER);

  // Parse type parameters if present: component Counter<T>()
  const typeParameters = this.parseTypeParameters();

  this.expect(TokenTypeEnum.LPAREN);

  // Use shared parameter parsing strategy (fixes type annotation bug)
  // Previously: manually parsed IDENTIFIER only (couldn't handle T[], A | B, etc.)
  // Now: calls parseTypeAnnotation() which handles all TypeScript types
  const params = parseParameterList(this);

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
    typeParameters: typeParameters.length > 0 ? typeParameters : undefined,
    params,
    body,
    exported: false,
    start,
    end: body.end,
  };
};
