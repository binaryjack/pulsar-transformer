/**
 * Parser.prototype.parseExportDeclaration
 * export component Counter() {}
 * export const Badge = () => {}
 * export interface IProps {}
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IExportNamedDeclaration } from '../parser.types.js';

Parser.prototype.parseExportDeclaration = function (this: IParser): IExportNamedDeclaration {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.EXPORT);

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
