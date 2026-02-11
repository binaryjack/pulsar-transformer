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
