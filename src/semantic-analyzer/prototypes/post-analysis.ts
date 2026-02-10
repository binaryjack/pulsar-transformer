/**
 * Post-analysis checks
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

/**
 * Check for unused symbols
 */
export function checkUnusedSymbols(this: ISemanticAnalyzer): void {
  for (const [key, symbol] of this.symbolTable.symbols) {
    // Skip exported symbols
    if (symbol.isExported) continue;

    // Skip parameters (often intentionally unused)
    if (symbol.kind === 'parameter') continue;

    // Warn about unused symbols
    if (!symbol.isUsed) {
      this.addWarning(
        symbol.kind === 'import' ? 'unused-import' : 'unused-variable',
        `'${symbol.name}' is declared but never used`,
        symbol.node
      );
    }
  }
}

/**
 * Check for dead code
 */
export function checkDeadCode(this: ISemanticAnalyzer): void {
  // Future: Implement dead code detection
  // - Code after return statements
  // - Unreachable branches
  // - Unused functions
}
