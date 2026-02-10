/**
 * Parse PSR Element
 *
 * Parses JSX-like element syntax into AST node.
 *
 * @example
 * <button class="btn" onClick={() => handle()}>Click</button>
 */

import type {
  IPSRAttributeNode,
  IPSRComponentReferenceNode,
  IPSRElementNode,
  IPSRFragmentNode,
  IPSRSpreadAttributeNode,
} from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';
import { decodeHTMLEntities } from '../utils/decode-html-entities.js';

/**
 * Helper to check if tag name starts with uppercase (component reference)
 */
function isComponentReference(tagName: string): boolean {
  return tagName.length > 0 && tagName[0] === tagName[0].toUpperCase();
}

/**
 * Parse PSR element
 *
 * Grammar:
 *   < > Children* < / >  (Fragment)
 *   < TagName Attributes? > Children* </ TagName >
 *   < TagName Attributes? />
 */
export function parsePSRElement(
  this: IParserInternal
): IPSRElementNode | IPSRComponentReferenceNode | IPSRFragmentNode {
  const startToken = this._getCurrentToken()!;

  // Consume '<'
  this._expect('LT', 'Expected "<"');

  // Check if this is a fragment: <>
  if (this._check('GT')) {
    // Rewind and parse as fragment
    this._current--;
    return this._parseJSXFragment();
  }

  // Parse tag name
  const tagToken = this._expect('IDENTIFIER', 'Expected tag name');
  const tagName = tagToken!.value;

  // Parse attributes
  const attributes: (IPSRAttributeNode | IPSRSpreadAttributeNode)[] = [];

  while (!this._check('GT') && !this._check('SLASH') && !this._isAtEnd()) {
    const attr = this._parsePSRAttribute();
    if (attr) {
      attributes.push(attr);
    }
  }

  // Check for self-closing: />
  let selfClosing = false;
  if (this._match('SLASH')) {
    this._expect('GT', 'Expected ">" after "/"');
    selfClosing = true;
  } else {
    this._expect('GT', 'Expected ">"');
  }

  // Parse children (if not self-closing)
  const children: any[] = [];

  if (!selfClosing) {
    let childIterations = 0;
    const MAX_CHILD_ITERATIONS = 10000;

    while (!this._isClosingTag(tagName) && !this._isAtEnd()) {
      childIterations++;

      // Safety check for infinite loop in child parsing
      if (childIterations > MAX_CHILD_ITERATIONS) {
        const error = new Error(
          `[PARSER] Exceeded maximum child iterations (${MAX_CHILD_ITERATIONS}) for <${tagName}>. ` +
            `Position: ${this._current}/${this._tokens.length}. ` +
            `Current token: ${this._getCurrentToken()?.type}. ` +
            `Possible infinite loop in child parsing.`
        );
        if (this._logger) {
          this._logger.error('parser', 'Child iteration limit exceeded', error, {
            tagName,
            childIterations,
            position: this._current,
            currentToken: this._getCurrentToken(),
          });
        }
        throw error;
      }

      // Log progress for debugging
      if (childIterations % 100 === 0 && this._logger) {
        this._logger.log(
          'parser',
          'debug',
          `Parsing children of <${tagName}>: ${childIterations} iterations`,
          {
            tagName,
            childIterations,
            childrenCount: children.length,
            position: `${this._current}/${this._tokens.length}`,
          }
        );
      }

      const beforePosition = this._current;
      const child = this._parsePSRChild(tagName);

      // CRITICAL: Prevent infinite loop
      // If _parsePSRChild returns null and didn't advance, we're stuck
      if (!child && this._current === beforePosition) {
        // Skip this token to avoid infinite loop
        if (this._logger) {
          this._logger.log(
            'parser',
            'error',
            `Stuck parsing child in <${tagName}>, forcing advance`,
            {
              tagName,
              position: this._current,
              token: this._getCurrentToken(),
            }
          );
        }
        console.error(
          `[PARSER ERROR] Stuck parsing child in <${tagName}> at position ${this._current}, skipping token:`,
          this._getCurrentToken()
        );
        this._advance();
      }

      if (child) {
        children.push(child);
      }
    }

    if (this._logger && childIterations > 50) {
      this._logger.log('parser', 'debug', `Completed parsing <${tagName}> children`, {
        tagName,
        childrenCount: children.length,
        iterations: childIterations,
      });
    }

    // Parse closing tag: </TagName>
    // Check for new LESS_THAN_SLASH token (</)
    if (this._check('LESS_THAN_SLASH')) {
      this._expect('LESS_THAN_SLASH', 'Expected "</"');
      const closeTag = this._expect('IDENTIFIER', 'Expected closing tag name');

      if (closeTag.value !== tagName) {
        this._addError({
          code: 'PSR-E003',
          message: `Mismatched closing tag. Expected "</${tagName}>" but got "</${closeTag.value}>"`,
          location: { line: closeTag.line, column: closeTag.column },
          token: closeTag,
        });
      }

      this._expect('GT', 'Expected ">" after closing tag');
    } else {
      // Legacy format: < / TagName >
      this._expect('LT', 'Expected "<"');
      this._expect('SLASH', 'Expected "/"');
      const closeTag = this._expect('IDENTIFIER', 'Expected closing tag name');

      if (closeTag.value !== tagName) {
        this._addError({
          code: 'PSR-E003',
          message: `Mismatched closing tag. Expected "</${tagName}>" but got "</${closeTag.value}>"`,
          location: { line: closeTag.line, column: closeTag.column },
          token: closeTag,
        });
      }

      this._expect('GT', 'Expected ">" after closing tag');
    }
  }

  const endToken = this._getCurrentToken() || startToken;

  // Check if this is a component reference (uppercase tag name)
  if (isComponentReference(tagName)) {
    return {
      type: ASTNodeType.PSR_COMPONENT_REFERENCE,
      componentName: tagName,
      attributes,
      children,
      selfClosing,
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

  // HTML element
  return {
    type: ASTNodeType.PSR_ELEMENT,
    tagName,
    attributes,
    children,
    selfClosing,
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

/**
 * Parse PSR attribute or spread attribute
 */
function _parsePSRAttribute(
  this: IParserInternal
): IPSRAttributeNode | IPSRSpreadAttributeNode | null {
  const startToken = this._getCurrentToken();

  if (!startToken) {
    return null;
  }

  // Handle spread attribute: {...props}
  if (startToken!.type === 'LBRACE') {
    this._advance(); // Consume '{'

    if (this._check('SPREAD')) {
      this._advance(); // Consume '...'
      const argument = this._parseExpression();
      this._expect('RBRACE', 'Expected "}" after spread attribute');

      return {
        type: ASTNodeType.PSR_SPREAD_ATTRIBUTE,
        argument,
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
    } else {
      // Not a spread, backtrack
      this._current--;
      return null;
    }
  }

  // Regular attribute
  if (startToken!.type !== 'IDENTIFIER') {
    return null;
  }

  const nameToken = startToken;
  this._advance(); // Consume attribute name

  let value: any = null;
  let isStatic = true;

  // Check for attribute value
  if (this._match('ASSIGN')) {
    // Static string value
    if (this._check('STRING')) {
      const valueToken = this._advance();
      value = {
        type: ASTNodeType.LITERAL,
        value: valueToken!.value,
        raw: `"${valueToken!.value}"`,
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
    // Dynamic value: {expression}
    else if (this._match('LBRACE')) {
      isStatic = false;

      // Check if this is an empty expression (JSX comment was skipped by lexer)
      if (this._check('RBRACE')) {
        this._advance(); // Consume RBRACE
        value = null; // Empty/comment value
      } else {
        // SAFETY: Set context flag to prevent infinite recursion
        // When parsing expressions inside JSX attributes, disable JSX parsing
        // This prevents: <button style={{...}}> -> parseExpression -> parsePrimaryExpression -> parsePSRElement (infinite loop)
        const wasInJSXAttributeExpression = this._inJSXAttributeExpression;
        this._inJSXAttributeExpression = true;

        value = this._parseJSXExpression();

        // Restore previous context
        this._inJSXAttributeExpression = wasInJSXAttributeExpression;

        // Check if expression parsing failed
        if (value === null) {
          this._addError({
            code: 'PSR-E003',
            message: 'Failed to parse expression in JSX attribute',
            location: {
              line: this._getCurrentToken()?.line || 0,
              column: this._getCurrentToken()?.column || 0,
            },
          });
          return null;
        }

        this._expect('RBRACE', 'Expected "}" after expression');
      }
    }
  }

  return {
    type: ASTNodeType.PSR_ATTRIBUTE,
    name: nameToken!.value,
    value,
    isStatic,
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
}

/**
 * Parse PSR child node
 */
function _parsePSRChild(this: IParserInternal, parentTagName?: string): any {
  const token = this._getCurrentToken();

  if (!token) {
    return null;
  }

  // Signal binding: $(signal)
  if (token.type === 'SIGNAL_BINDING') {
    return this._parsePSRSignalBinding();
  }

  // Nested element: <tag>
  if (token.type === 'LT') {
    return this._parsePSRElement();
  }

  // JSX Text content (from JSX text scanning mode)
  if (token.type === 'JSX_TEXT') {
    // Decode HTML entities first, then normalize whitespace
    const decoded = decodeHTMLEntities(token.value);
    const textValue = normalizeJSXWhitespace(decoded);
    this._advance();

    // Skip empty text nodes
    if (textValue.trim().length === 0) {
      return null;
    }

    return {
      type: ASTNodeType.LITERAL,
      value: textValue,
      raw: textValue,
      location: {
        start: {
          line: token.line,
          column: token.column,
          offset: token.start,
        },
        end: {
          line: token.line,
          column: token.column + token.value.length,
          offset: token.end,
        },
      },
    };
  }

  // Expression: {expr} or JSX comment {/* ... */}
  if (token.type === 'LBRACE') {
    this._advance();

    // Check if this is an empty expression (JSX comment was skipped by lexer)
    // The lexer skips comments, so if we see RBRACE immediately, it was a comment
    if (this._check('RBRACE')) {
      this._advance(); // Consume the RBRACE
      return null; // Skip JSX comments in output
    }

    const expr = this._parseJSXExpression();
    this._expect('RBRACE', 'Expected "}" after expression');
    return expr;
  }

  // Text content - collect all consecutive text tokens
  if (
    token.type === 'IDENTIFIER' ||
    token.type === 'STRING' ||
    token.type === 'NUMBER' ||
    token.type === 'COLON' ||
    token.type === 'SEMICOLON' ||
    token.type === 'COMMA' ||
    token.type === 'DOT' ||
    token.type === 'QUESTION' ||
    token.type === 'EXCLAMATION'
  ) {
    const startToken = token;
    let textValue = '';
    let tokenCount = 0;
    const MAX_TEXT_TOKENS = 1000; // Safety limit

    // Collect all consecutive text-like tokens
    while (
      this._getCurrentToken() &&
      !this._check('LT') &&
      !this._check('LESS_THAN_SLASH') &&
      !this._check('LBRACE') &&
      !this._check('SIGNAL_BINDING') &&
      !this._isAtEnd() &&
      tokenCount < MAX_TEXT_TOKENS
    ) {
      const current = this._getCurrentToken()!;

      textValue += current.value;
      this._advance();
      tokenCount++;

      // Add space between tokens if there's whitespace
      const next = this._getCurrentToken();
      if (next && next.start > current.end) {
        textValue += ' ';
      }
    }

    // Safety check: if we hit the limit, log error
    if (tokenCount >= MAX_TEXT_TOKENS) {
      console.error('[PARSER ERROR] Text collection exceeded token limit, possible infinite loop');
    }

    if (textValue.trim()) {
      return {
        type: ASTNodeType.PSR_TEXT_NODE,
        value: textValue.trim(),
        location: {
          start: {
            line: startToken.line,
            column: startToken.column,
            offset: startToken.start,
          },
          end: {
            line: this._getCurrentToken()?.line || startToken.line,
            column: this._getCurrentToken()?.column || startToken.column,
            offset: this._getCurrentToken()?.start || startToken.end,
          },
        },
      };
    }
  }

  // Unknown - skip
  this._advance();
  return null;
}

/**
 * Check if current position is closing tag
 */
function _isClosingTag(this: IParserInternal, tagName: string): boolean {
  // Check for new LESS_THAN_SLASH token (</)
  if (this._check('LESS_THAN_SLASH')) {
    const closeTagToken = this._tokens[this._current + 1];
    return closeTagToken && closeTagToken!.value === tagName;
  }

  // Legacy check for separate LT and SLASH tokens
  if (!this._check('LT')) {
    return false;
  }

  // Peek ahead
  const nextToken = this._tokens[this._current + 1];
  if (!nextToken || nextToken!.type !== 'SLASH') {
    return false;
  }

  const closeTagToken = this._tokens[this._current + 2];
  return closeTagToken && closeTagToken!.value === tagName;
}

/**
 * Parse JSX expression - like _parseExpression but handles JSX context correctly
 * Avoids confusing {expression} with {key: value} object literals
 *
 * NOTE: The opening { has already been consumed by the caller
 */
function _parseJSXExpression(this: IParserInternal): any {
  const token = this._getCurrentToken();

  if (!token) {
    return null;
  }

  // Check if this might be an object literal by looking ahead
  // Pattern: identifier : or string :
  if ((token.type === 'IDENTIFIER' || token.type === 'STRING') && this._peek(1)?.type === 'COLON') {
    // This looks like an object literal property
    // We need to manually parse it since we've already consumed the opening {
    const startToken = this._tokens[this._current - 1]; // The LBRACE we already consumed

    // Reconstruct object literal parsing from this point
    const properties: any[] = [];

    // SAFETY: Prevent infinite loops
    let iterationCount = 0;
    const maxIterations = 1000;

    do {
      // Safety check
      if (++iterationCount > maxIterations) {
        this._addError({
          code: 'PSR-E007',
          message: 'Infinite loop detected while parsing object literal in JSX',
          location: {
            line: this._getCurrentToken()?.line || 0,
            column: this._getCurrentToken()?.column || 0,
          },
        });
        return null;
      }

      // Handle end of object before comma
      if (this._check('RBRACE')) {
        break;
      }

      // Handle spread properties
      if (this._check('SPREAD')) {
        this._advance();
        const restToken = this._expect('IDENTIFIER', 'Expected identifier after ...');

        properties.push({
          type: 'SpreadElement',
          argument: {
            type: ASTNodeType.IDENTIFIER,
            name: restToken!.value,
          },
        });
        break;
      }

      // Parse property key
      let keyToken;
      let keyName;

      if (this._check('IDENTIFIER')) {
        keyToken = this._expect('IDENTIFIER', 'Expected property name');
        keyName = keyToken!.value;
      } else if (this._check('STRING')) {
        keyToken = this._expect('STRING', 'Expected property name');
        keyName = keyToken!.value.slice(1, -1);
      } else {
        // Not a valid object literal
        return null;
      }

      this._expect('COLON', 'Expected ":" after property name');
      const value = this._parseExpression();

      // CRITICAL: Check if expression parsing failed or we're at unexpected token
      if (!value || this._isAtEnd()) {
        this._addError({
          code: 'PSR-E010',
          message: 'Failed to parse property value in object literal',
          location: {
            line: this._getCurrentToken()?.line || 0,
            column: this._getCurrentToken()?.column || 0,
          },
        });
        break;
      }

      properties.push({
        type: 'Property',
        key: {
          type: ASTNodeType.IDENTIFIER,
          name: keyName,
        },
        value,
      });

      // CRITICAL FIX: Break if no comma found (this prevents infinite loop)
      // Original: while (this._match('COMMA') && !this._check('RBRACE'))
      // Problem: If neither COMMA nor RBRACE, loops forever
      if (!this._match('COMMA')) {
        break;
      }
    } while (!this._check('RBRACE'));

    // CRITICAL FIX: Consume the closing RBRACE of the object literal
    // The caller will consume the outer RBRACE of the JSX expression
    this._expect('RBRACE', 'Expected "}" to close object literal');

    return {
      type: 'ObjectExpression',
      properties,
    };
  }

  // Not an object literal, parse as regular expression
  return this._parseExpression();
}

/**
 * Simplified non-object expression parser for JSX context
 */
function _parseNonObjectExpression(this: IParserInternal): any {
  // Simply delegate to regular expression parsing
  // The key is that we avoid calling this when we see LBRACE that could be confused
  return this._parseExpression();
}

/**
 * Normalize JSX whitespace following React's rules
 *
 * Rules:
 * 1. Remove leading/trailing whitespace on each line
 * 2. Collapse consecutive whitespace into single space
 * 3. Remove blank lines
 * 4. Join remaining lines with single space
 *
 * @param text - Raw JSX text content
 * @returns Normalized text
 */
function normalizeJSXWhitespace(text: string): string {
  // Split into lines
  const lines = text.split(/\r?\n/);

  // Trim each line
  const trimmedLines = lines.map((line) => line.trim());

  // Filter out empty lines
  const nonEmptyLines = trimmedLines.filter((line) => line.length > 0);

  // Join with single space
  const joined = nonEmptyLines.join(' ');

  // Collapse consecutive whitespace
  return joined.replace(/\s+/g, ' ');
}

// Export helper methods for prototype attachment
export {
  _isClosingTag,
  _parseJSXExpression,
  _parseNonObjectExpression,
  _parsePSRAttribute,
  _parsePSRChild,
};
