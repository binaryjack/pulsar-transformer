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
    while (!this._isClosingTag(tagName) && !this._isAtEnd()) {
      const beforePosition = this._current;
      const child = this._parsePSRChild(tagName);

      // CRITICAL: Prevent infinite loop
      // If _parsePSRChild returns null and didn't advance, we're stuck
      if (!child && this._current === beforePosition) {
        // Skip this token to avoid infinite loop
        console.error(
          `[PARSER ERROR] Stuck parsing child in <${tagName}>, skipping token:`,
          this._getCurrentToken()
        );
        this._advance();
      }

      if (child) {
        children.push(child);
      }
    }

    // Parse closing tag: </TagName>
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
      value = this._parseJSXExpression();

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

  // Expression: {expr}
  if (token.type === 'LBRACE') {
    this._advance();
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

    do {
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

      properties.push({
        type: 'Property',
        key: {
          type: ASTNodeType.IDENTIFIER,
          name: keyName,
        },
        value,
      });
    } while (this._match('COMMA'));

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

// Export helper methods for prototype attachment
export {
  _isClosingTag,
  _parseJSXExpression,
  _parseNonObjectExpression,
  _parsePSRAttribute,
  _parsePSRChild,
};
