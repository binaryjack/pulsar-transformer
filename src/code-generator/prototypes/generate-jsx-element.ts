/**
 * CodeGenerator.prototype.generateJSXElement
 * Transform JSX to t_element() calls
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generateJSXElement = function (this: ICodeGenerator, node: any): string {
  this.addImport('t_element');

  const tagName = node.openingElement.name.name;

  // Generate attributes object
  let attrs = '{}';
  if (node.openingElement.attributes.length > 0) {
    const attrPairs = node.openingElement.attributes
      .map((attr: any) => {
        const name = attr.name.name;
        let value;

        if (attr.value === null) {
          // Boolean attribute
          value = 'true';
        } else if (attr.value.type === 'Literal') {
          value = `'${attr.value.value}'`;
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
        children.push(`'${text}'`);
      }
    } else if (child.type === 'JSXExpressionContainer') {
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
