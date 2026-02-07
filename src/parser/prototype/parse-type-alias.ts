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
  if (startToken!.value !== 'type') {
    this._addError({
      code: 'PSR-E001',
      message: 'Expected "type" keyword',
      location: { line: startToken!.line, column: startToken!.column },
      token: startToken,
    });
    return null;
  }

  this._advance(); // consume 'type'

  // Parse type name
  const nameToken = this._expect('IDENTIFIER', 'Expected type name');
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

  // NOTE: For now, we don't parse generic type parameters in the type name
  // (e.g., the <T> in "type Nullable<T> = ..."). We just skip to the = sign.
  // This is a simplification because properly parsing generics requires
  // preventing the lexer from entering JSX mode when it sees <.
  // We skip all tokens until we find ASSIGN (=)
  if (this._getCurrentToken() && this._getCurrentToken()!.type !== 'ASSIGN') {
    // Skip tokens until we find = (handle JSX tokens that might be generated)
    let angleDepth = 0;
    while (!this._isAtEnd()) {
      const token = this._getCurrentToken();
      if (!token) break;

      // Check if this is the = sign
      if (token.type === 'ASSIGN' && angleDepth === 0) break;

      // Track angle bracket depth to handle nested generics
      if (token.type === 'LT') {
        angleDepth++;
      } else if (token.type === 'GT') {
        angleDepth--;
      } else if (token.type === 'JSX_TEXT' || token.type === 'IDENTIFIER') {
        // Skip JSX_TEXT and identifiers that might be inside generic parameters
      }

      this._advance();
    }
  }

  //  Expect =
  this._expect('ASSIGN', 'Expected "=" after type name');

  // Collect type definition until semicolon
  const typeTokens: Array<{ value: string; type: string }> = [];
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let angleDepth = 0;

  while (!this._isAtEnd()) {
    const token = this._getCurrentToken();
    if (!token) break;

    // Stop at semicolon when all brackets are balanced (check BEFORE collecting)
    if (
      (token.type === 'SEMICOLON' || token.value === ';') &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenDepth === 0 &&
      angleDepth === 0
    ) {
      break;
    }

    // Track depth BEFORE collecting
    if (token.type === 'LBRACE') braceDepth++;
    else if (token.type === 'RBRACE') braceDepth--;
    else if (token.type === 'LBRACKET') bracketDepth++;
    else if (token.type === 'RBRACKET') bracketDepth--;
    else if (token.type === 'LPAREN') parenDepth++;
    else if (token.type === 'RPAREN') parenDepth--;
    else if (token.value === '<' || token.type === 'LT') angleDepth++;
    else if (token.value === '>' || token.type === 'GT') angleDepth--;

    // Preserve quotes for string literals
    const tokenValue = token.type === 'STRING' ? `'${token.value}'` : token.value;
    typeTokens.push({ value: tokenValue, type: token.type });
    this._advance();
  }

  // Consume optional semicolon
  this._match('SEMICOLON');

  // Smart join: add spaces only where needed
  const typeAnnotation = _joinTypeTokens(typeTokens);

  return {
    type: ASTNodeType.TYPE_ALIAS,
    name,
    typeAnnotation,
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

/**
 * Join type tokens with smart whitespace handling
 * Based on how TypeScript/Prettier handle type formatting:
 * - NO spaces around: [ ] < > ( ) . ? !
 * - Space after: , :
 * - Space around: | & => extends keyof typeof in is
 * - Preserve quotes in string literals
 */
function _joinTypeTokens(tokens: Array<{ value: string; type: string }>): string {
  if (tokens.length === 0) return '';
  if (tokens.length === 1) return tokens[0].value;

  // Punctuation that NEVER has spaces around it
  const noSpacePunctuation = new Set(['[', ']', '<', '>', '(', ')', '.', '?', '!']);

  // Operators that need spaces around them
  const spacedOperators = new Set(['|', '&', '=>', 'extends', 'keyof', 'typeof', 'in', 'is']);

  // Punctuation that needs space AFTER but not before
  const spaceAfter = new Set([',', ':']);

  const result: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].value;
    const prevToken = i > 0 ? tokens[i - 1].value : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1].value : null;

    // Determine if we need a space before this token
    let needsSpace = false;

    if (result.length > 0 && prevToken) {
      // NEVER add space if current token is no-space punctuation
      if (noSpacePunctuation.has(token)) {
        needsSpace = false;
      }
      // NEVER add space if previous token is no-space punctuation
      else if (noSpacePunctuation.has(prevToken)) {
        needsSpace = false;
      }
      // Space after comma or colon
      else if (spaceAfter.has(prevToken)) {
        needsSpace = true;
      }
      // Space around operators
      else if (spacedOperators.has(token) || spacedOperators.has(prevToken)) {
        needsSpace = true;
      }
      // Space between two word tokens (identifiers/keywords)
      else if (_isWordToken(prevToken) && _isWordToken(token)) {
        needsSpace = true;
      }
    }

    if (needsSpace) {
      result.push(' ');
    }

    result.push(token);
  }

  return result.join('');
}

/**
 * Check if token is a word (identifier, keyword, etc.)
 */
function _isWordToken(token: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token);
}
