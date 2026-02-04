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
  IPSRElementNode,
  IPSRFragmentNode,
  IPSRSpreadAttributeNode,
} from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse PSR element
 *
 * Grammar:
 *   < > Children* < / >  (Fragment)
 *   < TagName Attributes? > Children* </ TagName >
 *   < TagName Attributes? />
 */
export function parsePSRElement(this: IParserInternal): IPSRElementNode | IPSRFragmentNode {
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
  const tagName = tagToken.value;

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
      const child = this._parsePSRChild();
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

  return {
    type: ASTNodeType.PSR_ELEMENT,
    tagName,
    attributes,
    children,
    selfClosing,
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
  if (startToken.type === 'LBRACE') {
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
    } else {
      // Not a spread, backtrack
      this._current--;
      return null;
    }
  }

  // Regular attribute
  if (startToken.type !== 'IDENTIFIER') {
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
        value: valueToken.value,
        raw: `"${valueToken.value}"`,
        location: {
          start: {
            line: valueToken.line,
            column: valueToken.column,
            offset: valueToken.start,
          },
          end: {
            line: valueToken.line,
            column: valueToken.column + valueToken.value.length,
            offset: valueToken.end,
          },
        },
      };
    }
    // Dynamic value: {expression}
    else if (this._match('LBRACE')) {
      isStatic = false;
      value = this._parseExpression();
      this._expect('RBRACE', 'Expected "}" after expression');
    }
  }

  return {
    type: ASTNodeType.PSR_ATTRIBUTE,
    name: nameToken.value,
    value,
    isStatic,
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
}

/**
 * Parse PSR child node
 */
function _parsePSRChild(this: IParserInternal): any {
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
    const expr = this._parseExpression();
    this._expect('RBRACE', 'Expected "}" after expression');
    return expr;
  }

  // Text content
  if (token.type === 'IDENTIFIER' || token.type === 'STRING') {
    this._advance();
    return {
      type: ASTNodeType.PSR_TEXT_NODE,
      value: token.value,
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
  if (!nextToken || nextToken.type !== 'SLASH') {
    return false;
  }

  const closeTagToken = this._tokens[this._current + 2];
  return closeTagToken && closeTagToken.value === tagName;
}

// Export helper methods for prototype attachment
export { _isClosingTag, _parsePSRAttribute, _parsePSRChild };
