/**
 * Analyze Import Declaration
 *
 * Tracks imports in analyzer context and marks variables as imported.
 */

import type { IImportDeclarationNode } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { IImportIR } from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze import declaration and track in context
 */
export function analyzeImport(this: IAnalyzerInternal, node: IImportDeclarationNode): IImportIR {
  const { source, specifiers } = node;

  // Track each imported identifier in context
  for (const specifier of specifiers) {
    // Map local name → source module
    this._context.imports.set(specifier.name, source.value);
  }

  // Build IR node for import
  const importIR: IImportIR = {
    type: IRNodeType.IMPORT,
    source: source.value,
    specifiers: specifiers.map((spec) => ({
      // Determine type based on specifier name/position
      // For now, treat all as ImportSpecifier (named import)
      // TODO: Distinguish default vs named imports
      type: 'ImportSpecifier',
      imported: spec.name,
      local: spec.name,
    })),
    metadata: {
      line: node.location?.start.line,
      column: node.location?.start.column,
      originalNode: node,
    },
  };

  return importIR;
}
