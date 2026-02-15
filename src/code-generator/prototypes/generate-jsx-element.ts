/**
 * CodeGenerator.prototype.generateJSXElement
 * Transform JSX to t_element() calls
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

/**
 * Get full tag name from JSX element name node (handles both JSXIdentifier and JSXMemberExpression)
 */
CodeGenerator.prototype.getJSXTagName = function (this: ICodeGenerator, nameNode: any): string {
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name;
  } else if (nameNode.type === 'JSXMemberExpression') {
    return this.getJSXTagName(nameNode.object) + '.' + nameNode.property.name;
  } else if (nameNode.type === 'JSXFragment') {
    return '<Fragment>';
  } else {
    throw new Error(`Unknown JSX element name type: ${nameNode.type}`);
  }
};

CodeGenerator.prototype.generateJSXElement = function (this: ICodeGenerator, node: any): string {
  const tagName = this.getJSXTagName(node.openingElement.name);

  // Handle React Fragment: just return children array directly
  if (tagName === '<Fragment>') {
    if (node.children.length === 0) {
      return '[]';
    }

    const childrenCode = node.children
      .map((child: any) => {
        if (child.type === 'JSXText') {
          const trimmed = child.value.trim();
          return trimmed ? JSON.stringify(trimmed) : null;
        } else if (child.type === 'JSXExpressionContainer') {
          return this.generateExpression(child.expression);
        } else if (child.type === 'JSXElement') {
          return this.generateJSXElement(child);
        }
        return null;
      })
      .filter((c: any) => c !== null);

    return childrenCode.length === 1 ? childrenCode[0] : '[' + childrenCode.join(', ') + ']';
  }

  // Check if this is a component (uppercase) or HTML element (lowercase)
  const isComponent = /^[A-Z]/.test(tagName);

  if (!isComponent) {
    // HTML elements use t_element()
    this.addImport('t_element');
  }

  // Generate attributes object
  let attrs = '{}';
  if (node.openingElement.attributes.length > 0) {
    const attrPairs = node.openingElement.attributes
      .map((attr: any) => {
        // Handle JSX spread attributes: {...props}
        if (attr.type === 'JSXSpreadAttribute') {
          return '...' + this.generateExpression(attr.argument);
        }

        // Handle regular JSX attributes: name={value}
        const name = attr.name.name;

        // DEBUG: Log attribute name
        if (name && name.includes(' ')) {
          console.log('[ATTR-DEBUG] Attribute name with space:', JSON.stringify(name));
          console.log('[ATTR-DEBUG] Full attribute:', JSON.stringify(attr));
        }

        let value;

        if (attr.value === null) {
          // Boolean attribute
          value = 'true';
        } else if (attr.value.type === 'Literal') {
          // Properly escape string attribute values
          const escapedValue = String(attr.value.value)
            .replace(/\\/g, '\\\\') // Escape backslashes first
            .replace(/'/g, "\\'") // Escape single quotes
            .replace(/\n/g, '\\n') // Escape newlines
            .replace(/\r/g, '\\r') // Escape carriage returns
            .replace(/\t/g, '\\t'); // Escape tabs
          value = "'" + escapedValue + "'";
        } else if (attr.value.type === 'JSXExpressionContainer') {
          value = this.generateExpression(attr.value.expression);
        } else {
          value = this.generateExpression(attr.value);
        }

        return name + ': ' + value;
      })
      .join(', ');

    attrs = '{ ' + attrPairs + ' }';
  }

  // Generate children array
  const children: string[] = [];
  const reactiveChildren: Array<{ index: number; expression: string }> = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    if (child.type === 'JSXText') {
      // Don't trim - preserve intentional spaces
      const text = child.value;
      console.log('[DEBUG-CODEGEN-JSXTEXT] Raw text value:', JSON.stringify(text));
      if (text && text.trim()) {
        // Only skip if completely empty/whitespace
        // Properly escape string: newlines, backslashes, single quotes
        const escapedText = text
          .replace(/\\/g, '\\\\') // Escape backslashes first
          .replace(/'/g, "\\'") // Escape single quotes
          .replace(/\n/g, '\\n') // Escape newlines
          .replace(/\r/g, '\\r') // Escape carriage returns
          .replace(/\t/g, '\\t'); // Escape tabs
        console.log('[DEBUG-CODEGEN-JSXTEXT] Escaped text:', JSON.stringify(escapedText));
        console.log('[DEBUG-CODEGEN-JSXTEXT] Final output:', "'" + escapedText + "'");
        children.push("'" + escapedText + "'");
      }
    } else if (child.type === 'JSXExpressionContainer') {
      // Skip JSX comments (JSXEmptyExpression)
      if (child.expression.type === 'JSXEmptyExpression') {
        continue; // Don't add comments to output
      }

      // Check if expression is reactive (contains function call)
      const isReactive = this.isReactiveExpression(child.expression);

      // DEBUG
      if (JSON.stringify(child.expression).includes('product.price')) {
        console.log('[JSX-DEBUG] isReactive:', isReactive);
      }

      if (isReactive && !isComponent) {
        // For HTML elements with reactive expressions
        // ALL reactive expressions need insert() approach because t_element children are static
        // unless t_element is modified to handle functions

        // Complex reactive: use insert() approach
        const expr = this.generateExpression(child.expression);
        const wrappedExpr = '() => ' + expr; // Use string concatenation to avoid template literal evaluation
        reactiveChildren.push({ index: children.length, expression: wrappedExpr });
        children.push("'__REACTIVE__'"); // Placeholder for reactive content (unique to avoid conflicts)
      } else {
        // For components or non-reactive: use as-is
        const expr = this.generateExpression(child.expression);
        // DEBUG
        if (expr.includes('product.price')) {
          console.log('[JSX-DEBUG] Non-reactive path, expression:', expr);
        }
        children.push(expr);
      }
    } else if (child.type === 'JSXElement') {
      children.push(this.generateJSXElement(child));
    }
  }

  // Generate children array without trailing comma
  // Use string concatenation to avoid $ interpolation in template literals
  const childrenArray = children.length > 0 ? '[' + children.join(', ') + ']' : '[]';

  // Generate different output for components vs HTML elements
  if (isComponent) {
    // Component: MyComponent({ prop1: value1, children: [...] })
    // Merge attributes and children into props object
    if (children.length > 0) {
      // Add children to props
      // Use function replacement to avoid $ interpretation in replace()
      const propsWithChildren =
        attrs === '{}'
          ? '{ children: ' + childrenArray + ' }'
          : attrs.replace(/}$/, () => ', children: ' + childrenArray + ' }');

      const result = tagName + '(' + propsWithChildren + ')';
      return result;
    } else {
      // No children, just props
      return tagName + '(' + attrs + ')';
    }
  } else {
    // HTML element with reactive children: use insert()
    if (reactiveChildren.length > 0) {
      this.addImport('insert');

      // Generate: (() => { const el = t_element(...); insert(el, ...); return el; })()
      const staticChildren = children.filter((c) => c !== "'__REACTIVE__'");
      const staticChildrenArray =
        staticChildren.length > 0 ? '[' + staticChildren.join(', ') + ']' : '[]';

      const insertCalls = reactiveChildren
        .map(({ expression }) => 'insert(_el$, ' + expression + ');')
        .join(' ');

      return (
        '((() => { const _el$ = ' +
        "t_element('" +
        tagName +
        "', " +
        attrs +
        ', ' +
        staticChildrenArray +
        '); ' +
        insertCalls +
        ' return _el$; })())'
      );
    }

    // HTML element: t_element('div', {...}, [...])
    const result = "t_element('" + tagName + "', " + attrs + ', ' + childrenArray + ')';
    return result;
  }
};

/**
 * Generate JSX Fragment: <>...</> becomes a children array
 */
CodeGenerator.prototype.generateJSXFragment = function (this: ICodeGenerator, node: any): string {
  if (node.children.length === 0) {
    return '[]';
  }

  const childrenCode = node.children
    .map((child: any) => {
      if (child.type === 'JSXText') {
        const trimmed = child.value.trim();
        return trimmed ? JSON.stringify(trimmed) : null;
      } else if (child.type === 'JSXExpressionContainer') {
        return this.generateExpression(child.expression);
      } else if (child.type === 'JSXElement') {
        return this.generateJSXElement(child);
      } else if (child.type === 'JSXFragment') {
        return this.generateJSXFragment(child);
      }
      return null;
    })
    .filter((c: any) => c !== null);

  return childrenCode.length === 1 ? childrenCode[0] : '[' + childrenCode.join(', ') + ']';
};
