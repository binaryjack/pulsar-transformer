/**
 * Parser.prototype.parseImportDeclaration
 * import { createSignal } from '@pulsar-framework/pulsar.dev';
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type {
  IIdentifier,
  IImportDeclaration,
  IImportSpecifier,
  IStringLiteral,
} from '../parser.types.js';

Parser.prototype.parseImportDeclaration = function (this: IParser): IImportDeclaration {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.IMPORT);

  // Check for full statement type import: import type { ... }
  let isFullTypeImport = false;
  if (this.match(TokenTypeEnum.IDENTIFIER) && this.peek().value === 'type') {
    isFullTypeImport = true;
    this.advance(); // consume 'type'
  }

  const specifiers: IImportSpecifier[] = [];

  // import { ... }
  if (this.match(TokenTypeEnum.LBRACE)) {
    this.advance(); // consume {

    while (!this.match(TokenTypeEnum.RBRACE) && !this.isAtEnd()) {
      // Check for inline type import: import { type Foo, ... }
      let isInlineTypeImport = false;
      if (
        !isFullTypeImport &&
        this.match(TokenTypeEnum.IDENTIFIER) &&
        this.peek().value === 'type'
      ) {
        isInlineTypeImport = true;
        this.advance(); // consume 'type'
      }

      const importedToken = this.expect(TokenTypeEnum.IDENTIFIER);

      const imported: IIdentifier = {
        type: 'Identifier',
        name: importedToken.value,
        start: importedToken.start,
        end: importedToken.end,
      };

      // Support: import { foo as bar }
      let local = imported;
      if (this.match(TokenTypeEnum.IDENTIFIER) && this.peek().value === 'as') {
        this.advance(); // consume 'as'
        const localToken = this.expect(TokenTypeEnum.IDENTIFIER);
        local = {
          type: 'Identifier',
          name: localToken.value,
          start: localToken.start,
          end: localToken.end,
        };
      }

      specifiers.push({
        type: 'ImportSpecifier',
        imported,
        local,
        typeOnly: isFullTypeImport || isInlineTypeImport,
        start: imported.start,
        end: local.end,
      });

      if (this.match(TokenTypeEnum.COMMA)) {
        this.advance();
      }
    }

    this.expect(TokenTypeEnum.RBRACE);
  }

  this.expect(TokenTypeEnum.FROM);

  const sourceToken = this.expect(TokenTypeEnum.STRING);
  const source: IStringLiteral = {
    type: 'Literal',
    value: sourceToken.value,
    raw: `"${sourceToken.value}"`,
    start: sourceToken.start,
    end: sourceToken.end,
  };

  // Optional semicolon
  if (this.match(TokenTypeEnum.SEMICOLON)) {
    this.advance();
  }

  return {
    type: 'ImportDeclaration',
    specifiers,
    source,
    typeOnly: isFullTypeImport,
    start,
    end: source.end,
  };
};
