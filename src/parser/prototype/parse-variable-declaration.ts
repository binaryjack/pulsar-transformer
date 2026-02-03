/**
 * Parse Variable Declaration
 *
 * Parses const/let variable declarations.
 *
 * @example
 * const count = createSignal(0);
 */

import type { IIdentifierNode, IVariableDeclarationNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse variable declaration
 *
 * Grammar:
 *   const Identifier = Expression ;
 *   let Identifier = Expression ;
 */
export function parseVariableDeclaration(this: IParserInternal): IVariableDeclarationNode {
  const startToken = this._getCurrentToken()!;

  // const or let
  const kind = startToken.value as 'const' | 'let';
  this._advance();

  // Parse identifier
  const idToken = this._expect('IDENTIFIER', 'Expected variable name');
  const id: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: idToken.value,
    location: {
      start: {
        line: idToken.line,
        column: idToken.column,
        offset: idToken.start,
      },
      end: {
        line: idToken.line,
        column: idToken.column + idToken.value.length,
        offset: idToken.end,
      },
    },
  };

  // Parse initializer
  let init: any = null;
  if (this._match('ASSIGN')) {
    init = this._parseExpression();
  }

  // Consume semicolon
  this._match('SEMICOLON');

  const endToken = this._getCurrentToken() || startToken;

  return {
    type: ASTNodeType.VARIABLE_DECLARATION,
    kind,
    id,
    init,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column,
        offset: endToken.end,
      },
    },
  };
}
