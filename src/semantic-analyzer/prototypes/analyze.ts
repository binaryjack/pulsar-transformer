/**
 * Main analyze method - entry point for semantic analysis
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';
import type { ISemanticAnalysisResult } from '../semantic-analyzer.types.js';

export function analyze(this: ISemanticAnalyzer): ISemanticAnalysisResult {
  // Analyze the entire program
  this.analyzeProgram(this.ast);

  // Post-analysis checks
  this.checkUnusedSymbols();
  this.checkDeadCode();

  // Return results
  return {
    symbolTable: this.symbolTable,
    errors: this.errors,
    warnings: this.warnings,
  };
}
