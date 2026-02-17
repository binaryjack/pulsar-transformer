/**
 * Analyze program (root node)
 * Prototype pattern implementation
 */

import type { IProgramNode } from '../../ast.types.js';
import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeProgram(this: ISemanticAnalyzer, node: IProgramNode): void {
  // Program uses global scope (already created in constructor)
  for (const statement of node.body) {
    this.analyzeStatement(statement);
  }
}

