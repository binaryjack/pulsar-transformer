/**
 * CodeGenerator.prototype.isReactiveExpression
 * Determines if an expression is reactive (should be wrapped in effect)
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

/**
 * Check if an expression is reactive (contains function calls or member expressions)
 * Reactive expressions need to be wrapped in effects for automatic updates
 */
CodeGenerator.prototype.isReactiveExpression = function (this: ICodeGenerator, node: any): boolean {
  if (!node) return false;

  // CallExpression: count(), signal.read(), etc.
  if (node.type === 'CallExpression') {
    return true;
  }

  // MemberExpression: obj.property (might be reactive)
  if (node.type === 'MemberExpression') {
    return true;
  }

  // ConditionalExpression: condition ? a : b
  if (node.type === 'ConditionalExpression') {
    return (
      this.isReactiveExpression(node.test) ||
      this.isReactiveExpression(node.consequent) ||
      this.isReactiveExpression(node.alternate)
    );
  }

  // LogicalExpression: a && b, a || b
  if (node.type === 'LogicalExpression') {
    return this.isReactiveExpression(node.left) || this.isReactiveExpression(node.right);
  }

  // BinaryExpression: a + b, a > b, etc.
  if (node.type === 'BinaryExpression') {
    return this.isReactiveExpression(node.left) || this.isReactiveExpression(node.right);
  }

  // UnaryExpression: !value, -value, etc.
  if (node.type === 'UnaryExpression') {
    return this.isReactiveExpression(node.argument);
  }

  // TemplateLiteral: `text ${expr}`
  if (node.type === 'TemplateLiteral') {
    return node.expressions.some((expr: any) => this.isReactiveExpression(expr));
  }

  // ArrayExpression: [a, b, c]
  if (node.type === 'ArrayExpression') {
    return node.elements.some((elem: any) => elem && this.isReactiveExpression(elem));
  }

  // ObjectExpression: { a: b }
  if (node.type === 'ObjectExpression') {
    return node.properties.some((prop: any) => {
      if (prop.type === 'SpreadElement') {
        return this.isReactiveExpression(prop.argument);
      }
      return this.isReactiveExpression(prop.value);
    });
  }

  // ArrowFunctionExpression or FunctionExpression: () => value
  // Functions themselves are not reactive (they're already wrapped)
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return false;
  }

  // Literals and Identifiers are not reactive
  if (
    node.type === 'Literal' ||
    node.type === 'Identifier' ||
    node.type === 'ThisExpression' ||
    node.type === 'Super'
  ) {
    return false;
  }

  // Default: assume non-reactive for safety
  return false;
};
