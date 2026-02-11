/**
 * Parser.prototype.parseTypeParameters
 * Parse generic type parameters: <T>, <T extends U>, <T = string>
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

/**
 * Parse type parameters for generics
 * Example: <T>, <T extends HTMLElement>, <K, V>, <T = string>
 */
Parser.prototype.parseTypeParameters = function (this: IParser): any[] {
  if (!this.match(TokenTypeEnum.LT)) {
    return [];
  }

  this.advance(); // consume <

  const typeParams: any[] = [];

  do {
    // Type parameter name
    const nameToken = this.expect(TokenTypeEnum.IDENTIFIER);

    const typeParam: any = {
      type: 'TypeParameter',
      name: nameToken.value,
      start: nameToken.start,
      end: nameToken.end,
    };

    // Check for extends constraint: T extends U
    if (this.match(TokenTypeEnum.IDENTIFIER) && this.peek().value === 'extends') {
      this.advance(); // consume 'extends'

      // Parse constraint type - can be ANY type (object literal, array, keyword, etc.)
      // Call parseTypeAnnotation() instead of expecting IDENTIFIER
      const constraint = this.parseTypeAnnotation();
      typeParam.constraint = constraint;
      typeParam.end = constraint.end;
    }

    // Check for default type: T = string
    if (this.match(TokenTypeEnum.EQUALS)) {
      this.advance(); // consume =

      // Parse default type - can be ANY type
      const defaultType = this.parseTypeAnnotation();
      typeParam.default = defaultType;
      typeParam.end = defaultType.end;
    }

    typeParams.push(typeParam);

    // Check for comma (more type parameters)
    if (this.match(TokenTypeEnum.COMMA)) {
      this.advance();
    } else {
      break;
    }
  } while (!this.match(TokenTypeEnum.GT) && !this.isAtEnd());

  this.expect(TokenTypeEnum.GT); // consume >

  return typeParams;
};
