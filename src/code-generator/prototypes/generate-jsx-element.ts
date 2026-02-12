/**
 * CodeGenerator.prototype.generateJSXElement
 * Transform JSX to t_element() calls
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generateJSXElement = function (this: ICodeGenerator, node: any): string {
  const tagName = node.openingElement.name.name;

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
          return `...${this.generateExpression(attr.argument)}`;
        }

        // Handle regular JSX attributes: name={value}
        const name = attr.name.name;
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
          value = `'${escapedValue}'`;
        } else if (attr.value.type === 'JSXExpressionContainer') {
          value = this.generateExpression(attr.value.expression);
        } else {
          value = this.generateExpression(attr.value);
        }

        return `${name}: ${value}`;
      })
      .join(', ');

    attrs = `{ ${attrPairs} }`;
  }

  // Generate children array
  const children: string[] = [];
  const reactiveChildren: Array<{ index: number; expression: string }> = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    if (child.type === 'JSXText') {
      // Don't trim - preserve intentional spaces
      const text = child.value;
      if (text && text.trim()) {
        // Only skip if completely empty/whitespace
        // Properly escape string: newlines, backslashes, single quotes
        const escapedText = text
          .replace(/\\/g, '\\\\') // Escape backslashes first
          .replace(/'/g, "\\'") // Escape single quotes
          .replace(/\n/g, '\\n') // Escape newlines
          .replace(/\r/g, '\\r') // Escape carriage returns
          .replace(/\t/g, '\\t'); // Escape tabs
        children.push(`'${escapedText}'`);
      }
    } else if (child.type === 'JSXExpressionContainer') {
      // Skip JSX comments (JSXEmptyExpression)
      if (child.expression.type === 'JSXEmptyExpression') {
        continue; // Don't add comments to output
      }

      // Check if expression is reactive (contains function call)
      const isReactive = this.isReactiveExpression(child.expression);

      if (isReactive && !isComponent) {
        // For HTML elements: track reactive children to use insert()
        const wrappedExpr = `() => ${this.generateExpression(child.expression)}`;
        reactiveChildren.push({ index: children.length, expression: wrappedExpr });
        children.push('null'); // Placeholder for now
      } else {
        // For components or non-reactive: use as-is
        children.push(this.generateExpression(child.expression));
      }
    } else if (child.type === 'JSXElement') {
      children.push(this.generateJSXElement(child));
    }
  }

  // Add trailing comma only if children contain JSXElements (not just text/expressions)
  const hasJSXElementChildren = children.some(
    (child) => child.startsWith('t_element(') || /^[A-Z]/.test(child.charAt(0))
  );
  const childrenArray =
    children.length > 0
      ? hasJSXElementChildren
        ? `[${children.join(', ')},]`
        : `[${children.join(', ')}]`
      : '[]';

  // Generate different output for components vs HTML elements
  if (isComponent) {
    // Component: MyComponent({ prop1: value1, children: [...] })
    // Merge attributes and children into props object
    if (children.length > 0) {
      // Add children to props
      const propsWithChildren =
        attrs === '{}'
          ? `{ children: ${childrenArray} }`
          : attrs.replace(/}$/, `, children: ${childrenArray} }`);
      return `${tagName}(${propsWithChildren})`;
    } else {
      // No children, just props
      return `${tagName}(${attrs})`;
    }
  } else {
    // HTML element with reactive children: use insert()
    if (reactiveChildren.length > 0) {
      this.addImport('insert');

      // Generate: (() => { const el = t_element(...); insert(el, ...); return el; })()
      const staticChildren = children.filter((c) => c !== 'null');
      const staticChildrenArray =
        staticChildren.length > 0 ? `[${staticChildren.join(', ')}]` : '[]';

      const insertCalls = reactiveChildren
        .map(({ expression }) => `insert(_el$, ${expression});`)
        .join(' ');

      return `(() => { const _el$ = t_element('${tagName}', ${attrs}, ${staticChildrenArray}); ${insertCalls} return _el$; })()`;
    }

    // HTML element: t_element('div', {...}, [...])
    return `t_element('${tagName}', ${attrs}, ${childrenArray})`;
  }
};
