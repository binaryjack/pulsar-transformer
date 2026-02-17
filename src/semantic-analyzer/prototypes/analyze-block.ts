/**
 * Analyze block statement
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeBlockStatement(this: ISemanticAnalyzer, node: any): void {
  // Enter block scope
  this.enterScope('block');

  // Analyze all statements in block
  for (const statement of node.body) {
    this.analyzeStatement(statement);
  }

  // Exit block scope
  this.exitScope();
}

