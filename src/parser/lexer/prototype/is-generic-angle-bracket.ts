/**
 * Is Generic Angle Bracket
 *
 * Heuristic to determine if `<` is the start of a generic type parameter
 * or a JSX element. Uses lookahead and lookbehind to disambiguate.
 *
 * Heuristics for generics:
 * - Preceded by class/interface/type/function keyword: `class Foo<T>`
 * - Strong indicators after: `<T>`, `<T,`, `<T extends`, `<T =`
 *
 * Heuristics for JSX:
 * - Lowercase tag: `<div`
 * - Preceded by operator/punctuation: `return <Button>`, `foo = <Component>`
 * - At start of expression context
 */

import type { ILexerInternal } from '../lexer.types.js';

/**
 * Check if < is likely a generic bracket vs JSX tag
 *
 * @returns true if generic, false if JSX
 */
export function _isGenericAngleBracket(this: ILexerInternal): boolean {
  const startPos = this._position;

  // STEP 1: Check what comes BEFORE the <
  // Generic syntax MUST be preceded by an identifier (class/function/type name)
  // JSX can appear after operators: =, return, (, etc.
  let backPos = startPos - 2; // Position before '<'

  // Skip whitespace before <
  while (backPos >= 0 && /\s/.test(this._source[backPos])) {
    backPos--;
  }

  if (backPos < 0) {
    return false; // < at start = JSX
  }

  const charBeforeLt = this._source[backPos];

  // If < is preceded by operator or punctuation, it's JSX expression context
  // Examples: `return <Button>`, `foo = <div>`, `call(<Component>)`
  if (/[=(),;\[{]/.test(charBeforeLt)) {
    return false;
  }

  // If preceded by 'return' keyword, it's JSX
  const beforeTrimmed = this._source.substring(Math.max(0, backPos - 6), backPos + 1).trim();
  if (beforeTrimmed.endsWith('return')) {
    return false;
  }

  // STEP 2: If preceded by identifier, read it and check context
  let prevIdent = '';
  if (this._isAlphaNumeric(charBeforeLt)) {
    // Read identifier backwards
    let pos = backPos;
    while (pos >= 0 && this._isAlphaNumeric(this._source[pos])) {
      prevIdent = this._source[pos] + prevIdent;
      pos--;
    }

    // Skip whitespace before identifier
    while (pos >= 0 && /\s/.test(this._source[pos])) {
      pos--;
    }

    // Read keyword before identifier
    let keyword = '';
    while (pos >= 0 && this._isAlpha(this._source[pos])) {
      keyword = this._source[pos] + keyword;
      pos--;
    }

    // Check if preceded by class, interface, type, function, extends
    if (
      keyword === 'class' ||
      keyword === 'interface' ||
      keyword === 'type' ||
      keyword === 'function' ||
      keyword === 'extends'
    ) {
      return true; // Definitely a generic
    }
  } else {
    return false;
  }

  // STEP 3: Check what comes AFTER the <
  let pos = startPos;
  while (pos < this._source.length && /\s/.test(this._source[pos])) {
    pos++;
  }

  if (pos >= this._source.length) {
    return false;
  }

  const firstChar = this._source[pos];

  // Lowercase letter -> likely HTML tag -> JSX
  if (/[a-z]/.test(firstChar)) {
    return false;
  }

  // Read identifier after <
  let ident = '';
  while (pos < this._source.length && this._isAlphaNumeric(this._source[pos])) {
    ident += this._source[pos];
    pos++;
  }

  if (!ident) {
    return false;
  }

  // Skip whitespace after identifier
  while (pos < this._source.length && /\s/.test(this._source[pos])) {
    pos++;
  }

  if (pos >= this._source.length) {
    return false;
  }

  const nextChar = this._source[pos];

  // Strong generic indicators
  if (nextChar === '>' || nextChar === ',' || nextChar === '=') {
    return true;
  }

  // Check for 'extends' keyword
  if (this._source.substring(pos, pos + 7) === 'extends') {
    return true;
  }

  // Check for 'in' keyword (mapped types)
  if (this._source.substring(pos, pos + 2) === 'in') {
    return true;
  }

  // Default to JSX if ambiguous - conservative approach
  return false;
}
