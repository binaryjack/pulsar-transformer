/**
 * Parse Variable Declaration
 *
 * Parses const/let variable declarations.
 *
 * @example
 * const count = createSignal(0);
 */

import type {
  IIdentifierNode,
  IObjectPatternNode,
  IVariableDeclarationNode,
} from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse variable declaration
 *
 * Grammar:
 *   const Identifier = Expression ;
 *   let Identifier = Expression ;
 *   const [a, b] = array;
 *   const { name, age } = user;
 */
export function parseVariableDeclaration(this: IParserInternal): IVariableDeclarationNode {
  const startToken = this._getCurrentToken()!;

  // const or let
  const kind = startToken!.value as 'const' | 'let';
  this._advance();

  // Parse identifier or destructuring pattern
  let id: IIdentifierNode | any;

  // Check for object destructuring: { a, b }
  if (this._check('LBRACE')) {
    this._advance(); // consume {

    const properties: IObjectPatternNode['properties'] = [];

    // Handle empty object destructuring: const { } = user;
    if (!this._check('RBRACE')) {
      do {
        const keyToken = this._expect('IDENTIFIER', 'Expected property name in destructuring');
        const key: IIdentifierNode = {
          type: ASTNodeType.IDENTIFIER,
          name: keyToken!.value,
          location: {
            start: {
              line: keyToken!.line,
              column: keyToken!.column,
              offset: keyToken!.start,
            },
            end: {
              line: keyToken!.line,
              column: keyToken!.column + keyToken!.value.length,
              offset: keyToken!.end,
            },
          },
        };

        // Check for renaming: { name: firstName }
        let value: IIdentifierNode = key;
        let shorthand = true;

        if (this._match('COLON')) {
          shorthand = false;
          const valueToken = this._expect('IDENTIFIER', 'Expected identifier after colon');
          value = {
            type: ASTNodeType.IDENTIFIER,
            name: valueToken!.value,
            location: {
              start: {
                line: valueToken!.line,
                column: valueToken!.column,
                offset: valueToken!.start,
              },
              end: {
                line: valueToken!.line,
                column: valueToken!.column + valueToken!.value.length,
                offset: valueToken!.end,
              },
            },
          };
        }

        properties.push({ key, value, shorthand });
      } while (this._match('COMMA'));
    }

    this._expect('RBRACE', 'Expected } after destructuring');

    // Create object pattern node
    id = {
      type: ASTNodeType.OBJECT_PATTERN,
      properties,
      location: {
        start: {
          line: startToken!.line,
          column: startToken!.column,
          offset: startToken!.start,
        },
        end: {
          line: this._getCurrentToken()!.line,
          column: this._getCurrentToken()!.column,
          offset: this._getCurrentToken()!.end,
        },
      },
    };
  }
  // Check for array destructuring: [a, b]
  else if (this._check('LBRACKET')) {
    this._advance(); // consume [

    const elements: IIdentifierNode[] = [];
    do {
      const elemToken = this._expect('IDENTIFIER', 'Expected identifier in destructuring');
      elements.push({
        type: ASTNodeType.IDENTIFIER,
        name: elemToken!.value,
        location: {
          start: {
            line: elemToken!.line,
            column: elemToken!.column,
            offset: elemToken!.start,
          },
          end: {
            line: elemToken!.line,
            column: elemToken!.column + elemToken!.value.length,
            offset: elemToken!.end,
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
      name: idToken!.value,
      location: {
        start: {
          line: idToken!.line,
          column: idToken!.column,
          offset: idToken!.start,
        },
        end: {
          line: idToken!.line,
          column: idToken!.column + idToken!.value.length,
          offset: idToken!.end,
        },
      },
    };
  }

  // Parse optional type annotation: : Type
  let typeAnnotation: any = null;
  if (this._check('COLON')) {
    this._advance(); // consume :

    // Read type tokens until we hit = or ; (but handle balanced braces/brackets/parens)
    const typeTokens: string[] = [];
    let braceDepth = 0;
    let bracketDepth = 0;
    let parenDepth = 0;

    while (!this._isAtEnd()) {
      const token = this._getCurrentToken();
      if (!token) break;

      // Track depth for balanced parsing
      if (token.type === 'LBRACE') braceDepth++;
      else if (token.type === 'RBRACE') braceDepth--;
      else if (token.type === 'LBRACKET') bracketDepth++;
      else if (token.type === 'RBRACKET') bracketDepth--;
      else if (token.type === 'LPAREN') parenDepth++;
      else if (token.type === 'RPAREN') parenDepth--;

      // Stop at = or ; only if all brackets are balanced
      if (braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
        if (token.type === 'ASSIGN' || token.type === 'SEMICOLON') {
          break;
        }
      }

      typeTokens.push(token.value);
      this._advance();
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
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.end,
      },
    },
  };
}
