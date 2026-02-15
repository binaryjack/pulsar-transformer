/**
 * Parser.prototype.isLikelyJSX
 * Disambiguate between JSX element and TypeScript generic type parameter
 *
 * Examples:
 * - JSX: <div>, <Component>, <>
 * - Type: <boolean>, <T>, <T, U>, <T extends U>
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';

/**
 * Check if current < token is likely the start of a JSX element
 * vs a TypeScript generic type parameter
 *
 * JSX patterns:
 * - <div> - lowercase identifier (HTML element)
 * - <Component> - uppercase identifier followed by space/attrs
 * - <> - fragment
 *
 * Type parameter patterns:
 * - <T> - followed by >
 * - <boolean> - followed by >
 * - <T, U> - followed by ,
 * - <T extends U> - contains extends
 * - <T = string> - contains =
 * - foo<T>() - in call expression context
 */
Parser.prototype.isLikelyJSX = function (this: IParser): boolean {
  // Must be at < token
  if (this.peek().type !== TokenTypeEnum.LT) {
    return false;
  }

  console.log('[JSX-DISAMBIG] Checking < token at position', this.current);

  // Save position for lookahead
  const savedPos = this.current;

  this.advance(); // consume <

  // Check what follows
  const next = this.peek();
  console.log('[JSX-DISAMBIG] After <, found token:', next.type, '=', next.value);

  // Fragment: <>
  if (next.type === TokenTypeEnum.GT) {
    this.current = savedPos;
    console.log('[JSX-DISAMBIG] Fragment detected -> JSX');
    return true;
  }

  // If not identifier after <, restore and return false (not JSX or type)
  if (next.type !== TokenTypeEnum.IDENTIFIER) {
    this.current = savedPos;
    console.log('[JSX-DISAMBIG] Not identifier after < -> NOT JSX');
    return false;
  }

  // Get the identifier name
  const name = next.value;
  this.advance(); // consume identifier

  // Check what follows the identifier
  const afterName = this.peek();
  console.log(
    '[JSX-DISAMBIG] After identifier',
    name,
    ', found:',
    afterName.type,
    '=',
    afterName.value
  );

  // Type parameter indicators vs JSX element disambiguation
  // CRITICAL: Both <T> and <div> follow pattern: < IDENTIFIER >
  // Need to check context AFTER the > to distinguish:
  // - <T>(param) → Type parameter before function call
  // - <div>content → JSX element with content
  if (afterName.type === TokenTypeEnum.GT) {
    // Look ahead past the > to see what follows
    this.advance(); // consume >
    const afterGT = this.peek();

    console.log('[JSX-DISAMBIG] After >, found:', afterGT.type, '=', afterGT.value);

    // Pattern: <identifier>( → Type parameter before function call
    if (afterGT.type === TokenTypeEnum.LPAREN) {
      this.current = savedPos;
      console.log('[JSX-DISAMBIG] Found >( pattern -> Type parameter');
      return false; // Type parameter like createSignal<boolean>(...)
    }

    // Pattern: <identifier>text or <identifier></ → JSX element
    // JSX content can be: text, other JSX, expressions, etc.
    this.current = savedPos;
    console.log('[JSX-DISAMBIG] Found JSX content after > -> JSX element');
    return true; // JSX like <div>content or <div></div>
  }

  // Other type parameter patterns: <T,>, <T=string>
  if (afterName.type === TokenTypeEnum.COMMA || afterName.type === TokenTypeEnum.EQUALS) {
    this.current = savedPos;
    console.log('[JSX-DISAMBIG] Type parameter pattern detected -> NOT JSX');
    return false; // Type parameter
  }

  // Type constraint: <T extends U>
  if (afterName.type === TokenTypeEnum.IDENTIFIER && afterName.value === 'extends') {
    this.current = savedPos;
    console.log('[JSX-DISAMBIG] Type constraint detected -> NOT JSX');
    return false; // Type parameter
  }

  // JSX patterns:
  // 1. Lowercase identifier (HTML element): <div>
  // 2. Followed by space/attributes
  // 3. Self-closing: <Component />

  // If lowercase, likely HTML element (JSX)
  if (name[0] === name[0].toLowerCase()) {
    this.current = savedPos;
    console.log('[JSX-DISAMBIG] Lowercase identifier -> JSX element');
    return true;
  }

  // If uppercase and followed by / or attributes, likely JSX component
  // For now, assume uppercase + not type indicators = JSX
  this.current = savedPos;
  console.log('[JSX-DISAMBIG] Uppercase identifier -> JSX component');
  return true;
};
