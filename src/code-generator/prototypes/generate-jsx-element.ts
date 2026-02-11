/**
 * CodeGenerator.prototype.generateJSXElement
 * Transform JSX to t_element() calls
 */

import type { ICodeGenerator } from '../code-generator.js'
import { CodeGenerator } from '../code-generator.js'

CodeGenerator.prototype.generateJSXElement = function (this: ICodeGenerator, node: any): string {
  this.addImport('t_element');

  const tagName = node.openingElement.name.name;

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
            .replace(/\\/g, '\\\\')  // Escape backslashes first
            .replace(/'/g, "\\'")    // Escape single quotes
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\r/g, '\\r')   // Escape carriage returns
            .replace(/\t/g, '\\t');  // Escape tabs
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

  for (const child of node.children) {
    if (child.type === 'JSXText') {
      // Don't trim - preserve intentional spaces
      const text = child.value;
      if (text && text.trim()) {
        // Only skip if completely empty/whitespace
        // Properly escape string: newlines, backslashes, single quotes
        const escapedText = text
          .replace(/\\/g, '\\\\')  // Escape backslashes first
          .replace(/'/g, "\\'")    // Escape single quotes
          .replace(/\n/g, '\\n')   // Escape newlines
          .replace(/\r/g, '\\r')   // Escape carriage returns
          .replace(/\t/g, '\\t');  // Escape tabs
        children.push(`'${escapedText}'`);
      }
    } else if (child.type === 'JSXExpressionContainer') {
      // Skip JSX comments (JSXEmptyExpression)
      if (child.expression.type === 'JSXEmptyExpression') {
        continue; // Don't add comments to output
      }
      children.push(this.generateExpression(child.expression));
    } else if (child.type === 'JSXElement') {
      children.push(this.generateJSXElement(child));
    }
  }

  // Add trailing comma only if children contain JSXElements (not just text/expressions)
  const hasJSXElementChildren = children.some((child) => child.startsWith('t_element('));
  const childrenArray =
    children.length > 0
      ? hasJSXElementChildren
        ? `[${children.join(', ')},]`
        : `[${children.join(', ')}]`
      : '[]';

  return `t_element('${tagName}', ${attrs}, ${childrenArray})`;
};
