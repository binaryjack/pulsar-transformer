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

  // Parse identifier or destructuring pattern
  let id: IIdentifierNode | any;

  // Check for array destructuring: [a, b]
  if (this._check('LBRACKET')) {
    this._advance(); // consume [

    const elements: IIdentifierNode[] = [];
    do {
      const elemToken = this._expect('IDENTIFIER', 'Expected identifier in destructuring');
      elements.push({
        type: ASTNodeType.IDENTIFIER,
        name: elemToken.value,
        location: {
          start: {
            line: elemToken.line,
            column: elemToken.column,
            offset: elemToken.start,
          },
          end: {
            line: elemToken.line,
            column: elemToken.column + elemToken.value.length,
            offset: elemToken.end,
          },
        },
      });
    } while (this._match('COMMA'));

    this._expect('RBRACKET', 'Expected ] after destructuring');

    // Create array pattern node
    id = {
      type: 'ArrayPattern' as any,
      elements,
    };
  } else {
    // Regular identifier
    const idToken = this._expect('IDENTIFIER', 'Expected variable name');
    id = {
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
  }

  // Parse optional type annotation: : Type
  let typeAnnotation: any = null;
  if (this._check('COLON')) {
    this._advance(); // consume :

    // Read type tokens until we hit = or ;
    const typeTokens: string[] = [];
    while (!this._check('ASSIGN') && !this._check('SEMICOLON') && !this._isAtEnd()) {
      const token = this._getCurrentToken();
      if (token) {
        typeTokens.push(token.value);
        this._advance();
      } else {
        break;
      }
    }

    if (typeTokens.length > 0) {
      const typeString = typeTokens.join(' ');
      typeAnnotation = {
        type: ASTNodeType.TYPE_ANNOTATION,
        typeString,
      };
    }
  }

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
    declarations: [
      {
        id,
        init,
        typeAnnotation,
      },
    ],
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
