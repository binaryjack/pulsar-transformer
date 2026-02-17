/**
 * Analyze interface declaration
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeInterfaceDeclaration(this: ISemanticAnalyzer, node: any): void {
  // Declare interface symbol
  this.declareSymbol(node.name.name, 'interface', null, node);

  // Interface properties don't create their own scope
  // They're type-level only, so we don't need to validate their members deeply
}

