/**
 * Parser.prototype.parseJSXElement
 * Parse JSX elements: <div>...</div>
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IJSXChild, IJSXElement } from '../parser.types.js';

Parser.prototype.parseJSXElement = function (this: IParser): IJSXElement {
  const start = this.peek().start;

  // Opening tag
  const openingElement = this.parseJSXOpeningElement();

  // Check for self-closing
  if (openingElement.selfClosing) {
    return {
      type: 'JSXElement',
      openingElement,
      children: [],
      closingElement: null,
      start,
      end: openingElement.end,
    };
  }

  // Parse children
  const children: IJSXChild[] = [];

  while (!this.isAtEnd()) {
    // Check for closing tag: </div>
    if (this.match(TokenTypeEnum.LT) && this.peek(1).type === TokenTypeEnum.SLASH) {
      break;
    }

    // JSX Expression: {count()}
    if (this.match(TokenTypeEnum.LBRACE)) {
      children.push(this.parseJSXExpressionContainer());
      continue;
    }

    // Nested JSX element: <span>...</span>
    if (this.match(TokenTypeEnum.LT)) {
      children.push(this.parseJSXElement());
      continue;
    }

    // Text content - accumulate all text-like tokens until JSX boundary
    if (this.match(TokenTypeEnum.IDENTIFIER) || 
        this.match(TokenTypeEnum.STRING) ||
        this.match(TokenTypeEnum.COLON) ||
        this.match(TokenTypeEnum.COMMA) ||
        this.match(TokenTypeEnum.DOT) ||
        this.match(TokenTypeEnum.QUESTION) ||
        this.match(TokenTypeEnum.EXCLAMATION)) {
      
      // Accumulate consecutive text tokens
      const textParts: string[] = [];
      const textStart = this.peek().start;
      let textEnd = this.peek().end;
      
      while (!this.isAtEnd() && 
             !this.match(TokenTypeEnum.LT) && 
             !this.match(TokenTypeEnum.JSX_TAG_CLOSE) && 
             !this.match(TokenTypeEnum.LBRACE)) {
        
        const token = this.peek();
        
        // Stop at JSX-specific tokens
        if (token.type === TokenTypeEnum.JSX_TAG_START ||
            token.type === TokenTypeEnum.JSX_TAG_END) {
          break;
        }
        
        // Accumulate text and punctuation
        if (token.type === TokenTypeEnum.IDENTIFIER ||
            token.type === TokenTypeEnum.STRING ||
            token.type === TokenTypeEnum.COLON ||
            token.type === TokenTypeEnum.COMMA ||
            token.type === TokenTypeEnum.DOT ||
            token.type === TokenTypeEnum.QUESTION ||
            token.type === TokenTypeEnum.EXCLAMATION) {
          textParts.push(token.value as string);
          // Add space after punctuation
          if (token.type === TokenTypeEnum.COLON ||
              token.type === TokenTypeEnum.COMMA) {
            textParts.push(' ');
          }
          textEnd = token.end;
          this.advance();
        } else {
          break;
        }
      }
      
      if (textParts.length > 0) {
        const textValue = textParts.join('');
        children.push({
          type: 'JSXText',
          value: textValue,
          raw: textValue,
          start: textStart,
          end: textEnd,
        });
      }
      continue;
    }

    // Unknown token - try to skip
    this.advance();
  }

  // Closing tag
  const closingElement = this.parseJSXClosingElement(openingElement.name.name);

  return {
    type: 'JSXElement',
    openingElement,
    children,
    closingElement,
    start,
    end: closingElement.end,
  };
};

/**
 * Parse JSX opening element: <div className="foo">
 */
Parser.prototype.parseJSXOpeningElement = function (this: IParser): any {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.LT);

  //Tag name
  const nameToken = this.expect(TokenTypeEnum.IDENTIFIER);
  const name = {
    type: 'JSXIdentifier',
    name: nameToken.value,
    start: nameToken.start,
    end: nameToken.end,
  };

  // Attributes
  const attributes: any[] = [];

  while (!this.match(TokenTypeEnum.GT) && !this.match(TokenTypeEnum.SLASH) && !this.isAtEnd()) {
    const attrName = this.expect(TokenTypeEnum.IDENTIFIER);

    // Attribute with value: className="foo" or onClick={handler}
    if (this.match(TokenTypeEnum.EQUALS)) {
      this.advance();

      let value;
      if (this.match(TokenTypeEnum.STRING)) {
        const valueToken = this.advance();
        value = {
          type: 'Literal',
          value: valueToken.value,
          raw: `"${valueToken.value}"`,
          start: valueToken.start,
          end: valueToken.end,
        };
      } else if (this.match(TokenTypeEnum.LBRACE)) {
        value = this.parseJSXExpressionContainer();
      } else {
        throw new Error(
          `Expected string or expression for JSX attribute value at line ${this.peek().line}`
        );
      }

      attributes.push({
        type: 'JSXAttribute',
        name: {
          type: 'JSXIdentifier',
          name: attrName.value,
          start: attrName.start,
          end: attrName.end,
        },
        value,
        start: attrName.start,
        end: value.end,
      });
    } else {
      // Boolean attribute: disabled (no value)
      attributes.push({
        type: 'JSXAttribute',
        name: {
          type: 'JSXIdentifier',
          name: attrName.value,
          start: attrName.start,
          end: attrName.end,
        },
        value: null,
        start: attrName.start,
        end: attrName.end,
      });
    }
  }

  // Self-closing: <div />
  let selfClosing = false;
  if (this.match(TokenTypeEnum.SLASH)) {
    this.advance();
    selfClosing = true;
  }

  const endToken = this.expect(TokenTypeEnum.GT);

  return {
    type: 'JSXOpeningElement',
    name,
    attributes,
    selfClosing,
    start,
    end: endToken.end,
  };
};

/**
 * Parse JSX closing element: </div>
 */
Parser.prototype.parseJSXClosingElement = function (this: IParser, expectedName: string): any {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.LT);
  this.expect(TokenTypeEnum.SLASH);

  const nameToken = this.expect(TokenTypeEnum.IDENTIFIER);

  if (nameToken.value !== expectedName) {
    throw new Error(
      `JSX closing tag mismatch: expected </${expectedName}>, got </${nameToken.value}> at line ${nameToken.line}`
    );
  }

  const endToken = this.expect(TokenTypeEnum.GT);

  return {
    type: 'JSXClosingElement',
    name: {
      type: 'JSXIdentifier',
      name: nameToken.value,
      start: nameToken.start,
      end: nameToken.end,
    },
    start,
    end: endToken.end,
  };
};

/**
 * Parse JSX expression container: {count()}
 */
Parser.prototype.parseJSXExpressionContainer = function (this: IParser): any {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.LBRACE);

  const expression = this.parseExpression();

  const endToken = this.expect(TokenTypeEnum.RBRACE);

  return {
    type: 'JSXExpressionContainer',
    expression,
    start,
    end: endToken.end,
  };
};
