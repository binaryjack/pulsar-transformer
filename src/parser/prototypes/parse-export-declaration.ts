/**
 * Parser.prototype.parseExportDeclaration
 * export component Counter() {}
 * export const Badge = () => {}
 * export interface IProps {}
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IExportDefaultDeclaration, IExportNamedDeclaration } from '../parser.types.js';

Parser.prototype.parseExportDeclaration = function (
  this: IParser
): IExportNamedDeclaration | IExportDefaultDeclaration {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.EXPORT);

  // Handle export default
  if (this.peek().type === TokenTypeEnum.DEFAULT) {
    this.expect(TokenTypeEnum.DEFAULT); // Consume the DEFAULT token
    const expression = this.parseExpression();
    if (this.match(TokenTypeEnum.SEMICOLON)) {
      // Optional semicolon for better error recovery
    }
    return {
      type: 'ExportDefaultDeclaration',
      declaration: expression,
      start,
      end: this.current > 0 ? this.tokens[this.current - 1].end : start,
    } as any;
  }

  let declaration = null;

  // Handle export { Name1, Name2 } syntax
  if (this.match(TokenTypeEnum.LBRACE)) {
    this.expect(TokenTypeEnum.LBRACE); // Consume the opening brace
    const specifiers = [];

    // Parse export specifiers: { Name1, Name2 as Alias, ... }
    while (this.peek().type !== TokenTypeEnum.RBRACE && !this.isAtEnd()) {
      const localStart = this.peek().start;
      const local = this.expect(TokenTypeEnum.IDENTIFIER).value;

      // Check for 'as' keyword for renamed exports
      let exported = local;
      let exportedEnd = this.tokens[this.current - 1].end;
      if (this.peek().type === TokenTypeEnum.IDENTIFIER && this.peek().value === 'as') {
        this.advance(); // consume 'as'
        exported = this.expect(TokenTypeEnum.IDENTIFIER).value;
        exportedEnd = this.tokens[this.current - 1].end;
      }

      specifiers.push({
        type: 'ExportSpecifier' as const,
        local: {
          type: 'Identifier' as const,
          name: local,
          start: localStart,
          end: this.tokens[this.current - 1].end,
        },
        exported: {
          type: 'Identifier' as const,
          name: exported,
          start: localStart,
          end: exportedEnd,
        },
        start: localStart,
        end: exportedEnd,
      });

      // Check for comma
      if (this.match(TokenTypeEnum.COMMA)) {
        continue;
      } else {
        break;
      }
    }

    this.expect(TokenTypeEnum.RBRACE);

    // Optional semicolon
    if (this.match(TokenTypeEnum.SEMICOLON)) {
      // Consumed
    }

    return {
      type: 'ExportNamedDeclaration',
      declaration: null,
      specifiers,
      start,
      end: this.current > 0 ? this.tokens[this.current - 1].end : start,
    };
  }

  // export component ...
  if (this.match(TokenTypeEnum.COMPONENT)) {
    const comp = this.parseComponentDeclaration();
    comp.exported = true;
    declaration = comp;
  }
  // export interface ...
  else if (this.match(TokenTypeEnum.INTERFACE)) {
    declaration = this.parseInterfaceDeclaration();
  }
  // export const/let/var ...
  else if (this.match(TokenTypeEnum.CONST, TokenTypeEnum.LET, TokenTypeEnum.VAR)) {
    declaration = this.parseVariableDeclaration();
  }
  // export function ...
  else if (this.match(TokenTypeEnum.FUNCTION)) {
    declaration = this.parseFunctionDeclaration();
  }

  return {
    type: 'ExportNamedDeclaration',
    declaration,
    specifiers: [],
    start,
    end: declaration?.end || start,
  };
};
