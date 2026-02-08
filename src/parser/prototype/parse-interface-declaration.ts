/**
 * Parse Interface Declaration
 *
 * Parses TypeScript interface declarations including inheritance.
 *
 * @example
 * interface IUser {
 *   name: string;
 *   age: number;
 * }
 *
 * interface IExtended extends IBase, IOther {
 *   extra: string;
 * }
 */

import type { IIdentifierNode, IInterfaceDeclarationNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse interface declaration
 */
export function parseInterfaceDeclaration(this: IParserInternal): IInterfaceDeclarationNode | null {
  const startToken = this._getCurrentToken();
  if (!startToken) return null;

  // Expect 'interface' keyword
  if (startToken!.value !== 'interface') {
    this._addError({
      code: 'PSR-E001',
      message: 'Expected "interface" keyword',
      location: { line: startToken!.line, column: startToken!.column },
      token: startToken,
    });
    return null;
  }

  this._advance(); // consume 'interface'

  // Parse interface name
  const nameToken = this._expect('IDENTIFIER', 'Expected interface name');
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
        offset: nameToken!.end,
      },
    },
  };

  // Skip generic type parameters if present: <T>, <T, U>
  if (this._check('LT')) {
    this._lexer.enterTypeContext(); // Enable type-aware tokenization
    this._advance(); // consume <
    let angleDepth = 1;

    while (!this._isAtEnd() && angleDepth > 0) {
      const token = this._getCurrentToken();
      if (!token) break;

      if (token.type === 'LT') {
        angleDepth++;
      } else if (token.type === 'GT') {
        angleDepth--;
        if (angleDepth === 0) {
          this._advance(); // consume final >
          this._lexer.exitTypeContext(); // Restore normal tokenization
          break;
        }
      } else if (token.type === 'JSX_TEXT') {
        // Skip JSX_TEXT tokens that might be generated for generic content
      }

      this._advance();
    }

    // Skip any JSX_TEXT or whitespace tokens after generic parameters
    while (this._check('JSX_TEXT') && !this._isAtEnd()) {
      this._advance();
    }
  }

  // Optional extends clause
  let extendsTypes: IIdentifierNode[] | undefined;
  if (this._check('EXTENDS')) {
    this._advance(); // consume 'extends'
    extendsTypes = [];

    do {
      const extendToken = this._expect('IDENTIFIER', 'Expected interface name after extends');
      extendsTypes.push({
        type: ASTNodeType.IDENTIFIER,
        name: extendToken!.value,
        location: {
          start: {
            line: extendToken!.line,
            column: extendToken!.column,
            offset: extendToken!.start,
          },
          end: {
            line: extendToken!.line,
            column: extendToken!.column + extendToken!.value.length,
            offset: extendToken!.end,
          },
        },
      });
    } while (this._match('COMMA'));
  }

  // Parse interface body: { ... }
  this._expect('LBRACE', 'Expected "{" to start interface body');

  // Collect all tokens until matching closing brace
  const bodyTokens: string[] = [];
  let braceDepth = 1;
  let parenDepth = 0; // Track parentheses for function types
  let angleDepth = 0; // Track angle brackets for generics

  while (!this._isAtEnd() && braceDepth > 0) {
    const token = this._getCurrentToken();
    if (!token) break;

    // Track depth of various bracket types
    if (token.type === 'LBRACE') {
      braceDepth++;
    } else if (token.type === 'RBRACE') {
      braceDepth--;
      if (braceDepth === 0) {
        break; // Don't include the closing brace
      }
    } else if (token.type === 'LPAREN') {
      parenDepth++;
    } else if (token.type === 'RPAREN') {
      parenDepth--;
    } else if (token.type === 'LT') {
      angleDepth++;
    } else if (token.type === 'GT') {
      angleDepth--;
    }

    bodyTokens.push(token.value);
    this._advance();
  }

  this._expect('RBRACE', 'Expected "}" to close interface body');

  const body = bodyTokens.join(' ').trim();

  return {
    type: ASTNodeType.INTERFACE_DECLARATION,
    name,
    extends: extendsTypes,
    body,
    location: {
      start: {
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: this._getCurrentToken()?.line || startToken!.line,
        column: this._getCurrentToken()?.column || startToken!.column,
        offset: this._getCurrentToken()?.end || startToken!.end,
      },
    },
  };
}
