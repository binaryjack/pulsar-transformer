/**
 * Analyze expression nodes
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeExpression(this: ISemanticAnalyzer, node: any): void {
  if (!node) return;

  switch (node.type) {
    case 'Identifier':
      // Variable reference - mark as used
      this.markSymbolUsed(node.name);
      const symbol = this.resolveSymbol(node.name);
      if (!symbol) {
        this.addError('undeclared-variable', `Undeclared variable '${node.name}'`, node);
      }
      break;

    case 'CallExpression':
      this.analyzeCallExpression(node);
      break;

    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      this.analyzeFunctionDeclaration(node);
      break;

    case 'BinaryExpression':
    case 'LogicalExpression':
      this.analyzeExpression(node.left);
      this.analyzeExpression(node.right);
      break;

    case 'UnaryExpression':
      this.analyzeExpression(node.argument);
      break;

    case 'MemberExpression':
      this.analyzeExpression(node.object);
      if (node.computed) {
        this.analyzeExpression(node.property);
      }
      break;

    case 'ConditionalExpression':
      this.analyzeExpression(node.test);
      this.analyzeExpression(node.consequent);
      this.analyzeExpression(node.alternate);
      break;

    case 'ArrayExpression':
      for (const element of node.elements) {
        if (element) {
          this.analyzeExpression(element);
        }
      }
      break;

    case 'ObjectExpression':
      for (const prop of node.properties) {
        if (prop.value) {
          this.analyzeExpression(prop.value);
        }
      }
      break;

    case 'JSXElement':
      this.analyzeJSXElement(node);
      break;

    case 'JSXFragment':
      for (const child of node.children) {
        if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
          this.analyzeExpression(child);
        } else if (child.type === 'JSXExpressionContainer') {
          this.analyzeExpression(child.expression);
        }
      }
      break;

    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
      // Literals don't need analysis
      break;

    default:
      // Unknown expression type
      break;
  }
}
