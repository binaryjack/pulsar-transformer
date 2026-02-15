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

  // Get tag name for matching closing tag (handle fragments)
  const tagName =
    openingElement.name.type === 'JSXFragment'
      ? '<Fragment>'
      : this.getJSXElementFullName(openingElement.name);

  // DEBUG: Log when parsing JSX element
  const isInArrowFunction = this.tokens
    .slice(Math.max(0, this.current - 10), this.current)
    .some((t) => t.type === TokenTypeEnum.ARROW);
  if (isInArrowFunction) {
    console.log('[DEBUG-JSX-IN-ARROW] Parsing JSX element:', tagName);
    console.log('[DEBUG-JSX-IN-ARROW] Self-closing:', openingElement.selfClosing);
    console.log(
      '[DEBUG-JSX-IN-ARROW] Next 5 tokens:',
      this.tokens.slice(this.current, this.current + 5).map((t) => `${t.type}:${t.value}`)
    );
  }

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

  // DEBUG: Track children collection in arrow function context
  if (isInArrowFunction) {
    console.log('[DEBUG-JSX-IN-ARROW] Starting children collection loop...');
  }

  while (!this.isAtEnd()) {
    // DEBUG: Show current token
    if (isInArrowFunction) {
      const curr = this.peek();
      console.log(
        `[DEBUG-JSX-IN-ARROW] Loop iteration, current token: ${curr.type}:${JSON.stringify(curr.value)}`
      );
    }

    // Skip comments in JSX
    if (this.match(TokenTypeEnum.COMMENT)) {
      this.advance();
      continue;
    }

    // Check for closing tag: </div>
    if (this.match(TokenTypeEnum.LT)) {
      // Peek ahead safely to check for slash
      const nextToken = this.peek(1);
      if (nextToken && nextToken.type === TokenTypeEnum.SLASH) {
        if (isInArrowFunction) {
          console.log('[DEBUG-JSX-IN-ARROW] Found closing tag, breaking children loop');
        }
        break; // This is a closing tag </div>
      } else {
        // This is a nested JSX element: <span>...</span>
        if (isInArrowFunction) {
          console.log('[DEBUG-JSX-IN-ARROW] Found nested JSX element');
        }
        children.push(this.parseJSXElement());
        continue;
      }
    }

    // JSX Expression: {count()}
    if (this.match(TokenTypeEnum.LBRACE)) {
      if (isInArrowFunction) {
        console.log('[DEBUG-JSX-IN-ARROW] Found LBRACE, parsing expression container');
      }
      children.push(this.parseJSXExpressionContainer());
      continue;
    }

    // JSX Text Content (from lexer)
    if (this.match(TokenTypeEnum.JSX_TEXT)) {
      const token = this.advance();
      if (isInArrowFunction) {
        console.log('[DEBUG-JSX-IN-ARROW] Found JSX_TEXT:', JSON.stringify(token.value));
      }
      children.push({
        type: 'JSXText',
        value: token.value,
        raw: token.value, // Use value as raw since lexer already handled it
        start: token.start,
        end: token.end,
      });
      continue;
    }

    // Text content - accumulate all text-like tokens until JSX boundary
    // (Fallback for non-JSX_TEXT tokens)
    if (
      this.match(TokenTypeEnum.IDENTIFIER) ||
      this.match(TokenTypeEnum.STRING) ||
      this.match(TokenTypeEnum.COLON) ||
      this.match(TokenTypeEnum.COMMA) ||
      this.match(TokenTypeEnum.DOT) ||
      this.match(TokenTypeEnum.QUESTION) ||
      this.match(TokenTypeEnum.EXCLAMATION)
    ) {
      // Accumulate consecutive text tokens
      const textParts: string[] = [];
      const textStart = this.peek().start;
      let textEnd = this.peek().end;

      while (
        !this.isAtEnd() &&
        !this.match(TokenTypeEnum.LT) &&
        !this.match(TokenTypeEnum.JSX_TAG_CLOSE) &&
        !this.match(TokenTypeEnum.LBRACE)
      ) {
        const token = this.peek();

        // Stop at JSX-specific tokens
        if (
          token.type === TokenTypeEnum.JSX_TAG_START ||
          token.type === TokenTypeEnum.JSX_TAG_END
        ) {
          break;
        }

        // Accumulate text and punctuation
        if (
          token.type === TokenTypeEnum.IDENTIFIER ||
          token.type === TokenTypeEnum.STRING ||
          token.type === TokenTypeEnum.COLON ||
          token.type === TokenTypeEnum.COMMA ||
          token.type === TokenTypeEnum.DOT ||
          token.type === TokenTypeEnum.QUESTION ||
          token.type === TokenTypeEnum.EXCLAMATION
        ) {
          textParts.push(token.value as string);
          // Add space after punctuation
          if (token.type === TokenTypeEnum.COLON || token.type === TokenTypeEnum.COMMA) {
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
    if (isInArrowFunction) {
      const curr = this.peek();
      console.log(
        '[DEBUG-JSX-IN-ARROW] Unknown/unhandled token, skipping:',
        `${curr.type}:${JSON.stringify(curr.value)}`
      );
    }
    this.advance();
  }

  // DEBUG: Show final children count
  if (isInArrowFunction) {
    console.log(`[DEBUG-JSX-IN-ARROW] Children collection complete. Count: ${children.length}`);
    children.forEach((child, i) => {
      console.log(
        `  Child ${i}: ${child.type} = ${JSON.stringify('value' in child ? child.value : '...')}`
      );
    });
  }

  // Closing tag
  const closingElement = this.parseJSXClosingElement(tagName);

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
 * Get full name string from JSX element name (handles both JSXIdentifier and JSXMemberExpression)
 */
Parser.prototype.getJSXElementFullName = function (this: IParser, nameNode: any): string {
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name;
  } else if (nameNode.type === 'JSXMemberExpression') {
    return this.getJSXElementFullName(nameNode.object) + '.' + nameNode.property.name;
  } else {
    throw new Error(`Unknown JSX element name type: ${nameNode.type}`);
  }
};

/**
 * Parse JSX element name (supports member expressions like Component.Sub)
 */
Parser.prototype.parseJSXElementName = function (this: IParser): any {
  const firstToken = this.expect(TokenTypeEnum.IDENTIFIER);

  let name: any = {
    type: 'JSXIdentifier',
    name: firstToken.value,
    start: firstToken.start,
    end: firstToken.end,
  };

  // Handle member expressions: Component.SubComponent.DeepComponent
  while (this.match(TokenTypeEnum.DOT)) {
    this.advance(); // consume dot
    const propertyToken = this.expect(TokenTypeEnum.IDENTIFIER);

    name = {
      type: 'JSXMemberExpression',
      object: name,
      property: {
        type: 'JSXIdentifier',
        name: propertyToken.value,
        start: propertyToken.start,
        end: propertyToken.end,
      },
      start: name.start,
      end: propertyToken.end,
    };
  }

  return name;
};

/**
 * Parse JSX opening element: <div className="foo">
 */
Parser.prototype.parseJSXOpeningElement = function (this: IParser): any {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.LT);

  // Check for React Fragment shorthand: <>
  if (this.match(TokenTypeEnum.GT)) {
    const gt = this.advance();
    return {
      type: 'JSXOpeningElement',
      name: {
        type: 'JSXFragment',
        start,
        end: gt.end,
      },
      attributes: [],
      selfClosing: false,
      start,
      end: gt.end,
    };
  }

  // Parse tag name (supports member expressions like ThemeContext.Provider)
  const name = this.parseJSXElementName();

  // Attributes
  const attributes: any[] = [];

  while (!this.match(TokenTypeEnum.GT) && !this.match(TokenTypeEnum.SLASH) && !this.isAtEnd()) {
    // Check for spread attribute: {...props}
    if (this.match(TokenTypeEnum.LBRACE)) {
      const lbrace = this.advance(); // consume {

      // Expect spread operator: ...
      if (!this.match(TokenTypeEnum.SPREAD)) {
        throw new Error(
          `Expected spread operator (...) after { in JSX attribute at line ${this.peek().line}`
        );
      }

      this.advance(); // consume ...

      // Parse the spread expression
      const argument = this.parseExpression();

      // Expect closing brace
      const rbrace = this.expect(TokenTypeEnum.RBRACE);

      attributes.push({
        type: 'JSXSpreadAttribute',
        argument,
        start: lbrace.start,
        end: rbrace.end,
      });

      continue; // Skip to next attribute
    }

    // Accept keywords as JSX attribute names
    const token = this.peek();

    if (token.type !== TokenTypeEnum.IDENTIFIER && !this.isKeywordToken(token.type)) {
      throw new Error(`Expected attribute name, got ${token.type} at line ${token.line}`);
    }

    const attrName = this.advance();

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
 * Parse JSX closing element: </div> or </ThemeContext.Provider>
 */
Parser.prototype.parseJSXClosingElement = function (this: IParser, expectedName: string): any {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.LT);
  this.expect(TokenTypeEnum.SLASH);

  // Check for React Fragment closing: </>
  if (this.match(TokenTypeEnum.GT)) {
    const gt = this.advance();

    // Validate fragment closing matches opening
    if (expectedName !== '<Fragment>') {
      throw new Error(
        `JSX closing tag </> does not match opening tag <${expectedName}> at line ${start}`
      );
    }

    return {
      type: 'JSXClosingElement',
      name: {
        type: 'JSXFragment',
        start,
        end: gt.end,
      },
      start,
      end: gt.end,
    };
  }

  // Parse closing tag name (supports member expressions)
  const name = this.parseJSXElementName();
  const actualName = this.getJSXElementFullName(name);

  if (actualName !== expectedName) {
    throw new Error(
      `JSX closing tag mismatch: expected </${expectedName}>, got </${actualName}> at line ${this.peek().line}`
    );
  }

  const endToken = this.expect(TokenTypeEnum.GT);

  return {
    type: 'JSXClosingElement',
    name,
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

  // Handle JSX comments: {/* ... */}
  if (this.match(TokenTypeEnum.COMMENT)) {
    const commentToken = this.advance();
    const endToken = this.expect(TokenTypeEnum.RBRACE);

    // Return a special JSXEmptyExpression for comments
    return {
      type: 'JSXExpressionContainer',
      expression: {
        type: 'JSXEmptyExpression',
        start: commentToken.start,
        end: commentToken.end,
      },
      start,
      end: endToken.end,
    };
  }

  const expression = this.parseExpression();

  const endToken = this.expect(TokenTypeEnum.RBRACE);

  return {
    type: 'JSXExpressionContainer',
    expression,
    start,
    end: endToken.end,
  };
};

/**
 * Parse JSX Fragment: <>...</>
 */
Parser.prototype.parseJSXFragment = function (this: IParser): any {
  const start = this.peek().start;

  // Consume the <>
  this.expect(TokenTypeEnum.JSX_FRAGMENT_OPEN);

  // Parse children
  const children: IJSXChild[] = [];

  while (!this.match(TokenTypeEnum.JSX_FRAGMENT_CLOSE) && !this.isAtEnd()) {
    const child = this.parseJSXChild();
    if (child) children.push(child);
  }

  // Consume the </>
  const endToken = this.expect(TokenTypeEnum.JSX_FRAGMENT_CLOSE);

  return {
    type: 'JSXFragment',
    children,
    start,
    end: endToken.end,
  };
};
