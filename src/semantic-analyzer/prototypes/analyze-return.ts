/**
 * Analyze return statement
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeReturnStatement(this: ISemanticAnalyzer, node: any): void {
  if (node.argument) {
    this.analyzeExpression(node.argument);
  }
}

