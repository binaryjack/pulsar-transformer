/**
 * Parse Type Alias Declaration
 *
 * Parses TypeScript type alias declarations.
 *
 * @example
 * type Status = 'idle' | 'loading' | 'success';
 * type Nullable<T> = T | null;
 * type User = { name: string; age: number };
 */

import type { IIdentifierNode, ITypeAliasNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse type alias declaration
 */
export function parseTypeAlias(this: IParserInternal): ITypeAliasNode | null {
  const startToken = this._getCurrentToken();
  if (!startToken) return null;

  // Expect 'type' keyword
  if (startToken.value !== 'type') {
    this._addError({
      code: 'PSR-E001',
      message: 'Expected "type" keyword',
      location: { line: startToken.line, column: startToken.column },
      token: startToken,
    });
    return null;
  }

  this._advance(); // consume 'type'

  // Parse type name
  const nameToken = this._expect('IDENTIFIER', 'Expected type name');
  const name: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken.value,
    location: {
      start: {
        line: nameToken.line,
        column: nameToken.column,
        offset: nameToken.start,
      },
      end: {
        line: nameToken.line,
        column: nameToken.column + nameToken.value.length,
        offset: nameToken.end,
      },
    },
  };

  // Skip generic type parameters if present: <T>, <T, U>
  if (this._check('LT')) {
    this._advance(); // consume <
    let angleDepth = 1;

    while (!this._isAtEnd() && angleDepth > 0) {
      const token = this._getCurrentToken();
      if (!token) break;

      if (token.value === '<') angleDepth++;
      else if (token.value === '>') angleDepth--;

      this._advance();
    }
  }

  // Expect =
  this._expect('ASSIGN', 'Expected "=" after type name');

  // Collect type definition until semicolon
  const typeTokens: string[] = [];
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let angleDepth = 0;

  while (!this._isAtEnd()) {
    const token = this._getCurrentToken();
    if (!token) break;

    // Stop at semicolon when all brackets are balanced
    if (
      token.type === 'SEMICOLON' &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenDepth === 0 &&
      angleDepth === 0
    ) {
      break;
    }

    // Collect token
    typeTokens.push(token.value);
    this._advance();

    // Track depth AFTER collecting
    const collectedToken = token;
    if (collectedToken.type === 'LBRACE') braceDepth++;
    else if (collectedToken.type === 'RBRACE') braceDepth--;
    else if (collectedToken.type === 'LBRACKET') bracketDepth++;
    else if (collectedToken.type === 'RBRACKET') bracketDepth--;
    else if (collectedToken.type === 'LPAREN') parenDepth++;
    else if (collectedToken.type === 'RPAREN') parenDepth--;
    else if (collectedToken.value === '<') angleDepth++;
    else if (collectedToken.value === '>') angleDepth--;
  }

  // Consume optional semicolon
  this._match('SEMICOLON');

  const typeAnnotation = typeTokens.join(' ').trim();

  return {
    type: ASTNodeType.TYPE_ALIAS,
    name,
    typeAnnotation,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: this._getCurrentToken()?.line || startToken.line,
        column: this._getCurrentToken()?.column || startToken.column,
        offset: this._getCurrentToken()?.end || startToken.end,
      },
    },
  };
}
