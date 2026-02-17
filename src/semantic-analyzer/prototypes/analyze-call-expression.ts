/**
 * Analyze call expression (function/method calls)
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeCallExpression(this: ISemanticAnalyzer, node: any): void {
  // Analyze callee
  this.analyzeExpression(node.callee);

  // Analyze arguments
  for (const arg of node.arguments) {
    this.analyzeExpression(arg);
  }

  // Special handling for reactivity functions
  if (node.callee.type === 'Identifier') {
    const funcName = node.callee.name;

    if (funcName === 'createSignal') {
      // Track signal creation for reactivity validation
      // Future: add to reactivity graph
    } else if (funcName === 'useEffect') {
      // Check effect dependencies
      this.checkEffectDependencies(node);
    }
  }
}

