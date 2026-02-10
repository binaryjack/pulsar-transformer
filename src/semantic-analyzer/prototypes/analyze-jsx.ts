/**
 * Analyze JSX elements
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeJSXElement(this: ISemanticAnalyzer, node: any): void {
  // Validate tag name
  if (node.openingElement) {
    const tagName = node.openingElement.name;

    // If component (starts with uppercase), check if declared
    if (tagName.type === 'JSXIdentifier' && /^[A-Z]/.test(tagName.name)) {
      const symbol = this.resolveSymbol(tagName.name);
      if (!symbol) {
        this.addError('undeclared-variable', `Component '${tagName.name}' is not defined`, node);
      } else {
        this.markSymbolUsed(tagName.name);
      }
    }

    // Analyze attributes
    for (const attr of node.openingElement.attributes) {
      if (attr.type === 'JSXAttribute' && attr.value) {
        if (attr.value.type === 'JSXExpressionContainer') {
          this.analyzeExpression(attr.value.expression);
        }
      }
    }
  }

  // Analyze children
  for (const child of node.children) {
    if (child.type === 'JSXElement') {
      this.analyzeJSXElement(child);
    } else if (child.type === 'JSXExpressionContainer') {
      this.analyzeExpression(child.expression);
    } else if (child.type === 'JSXFragment') {
      this.analyzeExpression(child);
    }
  }
}
