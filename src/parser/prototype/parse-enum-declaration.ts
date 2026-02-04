/**
 * Parse Enum Declaration
 *
 * Parses TypeScript enum declarations including:
 * - Basic enums: enum Status { Active, Inactive }
 * - Numeric enums: enum Code { OK = 200, NotFound = 404 }
 * - String enums: enum Direction { Up = "UP", Down = "DOWN" }
 * - Const enums: const enum Color { Red, Green, Blue }
 */

import type {
  IEnumDeclarationNode,
  IEnumMemberNode,
  IIdentifierNode,
} from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import type { IParser } from '../parser.types.js';

type IParserInternal = IParser & {
  _getCurrentToken(): any;
  _advance(): void;
  _expect(type: string, message: string): any;
  _check(type: string): boolean;
  _isAtEnd(): boolean;
};

/**
 * Parse enum declaration
 *
 * Syntax: [const] enum Name { Member1, Member2 = value }
 */
export function _parseEnumDeclaration(this: IParserInternal): IEnumDeclarationNode {
  const startToken = this._getCurrentToken();

  // Check for const modifier
  const isConst = this._check('CONST');
  if (isConst) {
    this._advance(); // consume 'const'
  }

  this._expect('ENUM', 'Expected enum keyword');

  // Parse enum name
  const nameToken = this._expect('IDENTIFIER', 'Expected enum name');
  const name: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken!.value,
    location: {
      start: {
        line: nameToken!.line,
        column: nameToken!.column,
        offset: nameToken!.start,
      },
      end: {
        line: nameToken!.line,
        column: nameToken!.column + nameToken!.value.length,
        offset: nameToken!.start + nameToken!.value.length,
      },
    },
  };

  // Parse enum body
  this._expect('LBRACE', 'Expected { to start enum body');

  const members: IEnumMemberNode[] = [];

  while (!this._check('RBRACE') && !this._isAtEnd()) {
    const memberStartToken = this._getCurrentToken();
    const memberNameToken = this._expect('IDENTIFIER', 'Expected enum member name');

    const memberName: IIdentifierNode = {
      type: ASTNodeType.IDENTIFIER,
      name: memberNameToken!.value,
      location: {
        start: {
          line: memberNameToken!.line,
          column: memberNameToken!.column,
          offset: memberNameToken!.start,
        },
        end: {
          line: memberNameToken!.line,
          column: memberNameToken!.column + memberNameToken!.value.length,
          offset: memberNameToken!.start + memberNameToken!.value.length,
        },
      },
    };

    // Parse optional initializer
    let initializer: any = null;
    if (this._check('ASSIGN')) {
      this._advance(); // consume =

      // Collect initializer tokens until comma or closing brace
      const initTokens: string[] = [];
      while (!this._check('COMMA') && !this._check('RBRACE') && !this._isAtEnd()) {
        const token = this._getCurrentToken();
        if (token) initTokens.push(token.value);
        this._advance();
      }

      if (initTokens.length > 0) {
        initializer = {
          type: 'Literal',
          value: initTokens.join(' '),
          raw: initTokens.join(' '),
        };
      }
    }

    const memberEndToken = this._getCurrentToken();

    members.push({
      type: ASTNodeType.ENUM_MEMBER,
      name: memberName,
      initializer,
      location: {
        start: {
          line: memberStartToken!.line,
          column: memberStartToken!.column,
          offset: memberStartToken!.start,
        },
        end: {
          line: memberEndToken!.line,
          column: memberEndToken!.column,
          offset: memberEndToken!.start,
        },
      },
    });

    // Skip comma if present
    if (this._check('COMMA')) {
      this._advance();
    }
  }

  this._expect('RBRACE', 'Expected } after enum body');

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.ENUM_DECLARATION,
    name,
    members,
    isConst,
    location: {
      start: {
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.start,
      },
    },
  };
}
