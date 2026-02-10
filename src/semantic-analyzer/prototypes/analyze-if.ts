/**
 * Analyze if statement
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeIfStatement(this: ISemanticAnalyzer, node: any): void {
  // Analyze test condition
  if (node.test) {
    this.analyzeExpression(node.test);
  }

  // Analyze consequent (then branch)
  if (node.consequent) {
    this.analyzeStatement(node.consequent);
  }

  // Analyze alternate (else branch)
  if (node.alternate) {
    this.analyzeStatement(node.alternate);
  }
}
