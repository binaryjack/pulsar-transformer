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
    // Map local name → source module (use alias if present)
    const localName = specifier.alias || specifier.name;
    this._context.imports.set(localName, String(source.value));
  }

  // Build IR node for import
  const importIR: IImportIR = {
    type: IRNodeType.IMPORT,
    source: String(source.value),
    specifiers: specifiers.map((spec, index) => {
      // Determine specifier type based on import kind
      let specifierType: 'ImportSpecifier' | 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier';

      if (node.importKind === 'default') {
        specifierType = 'ImportDefaultSpecifier';
      } else if (node.importKind === 'namespace') {
        specifierType = 'ImportNamespaceSpecifier';
      } else if (node.importKind === 'mixed') {
        // Mixed import: first specifier is default, rest are named
        specifierType = index === 0 ? 'ImportDefaultSpecifier' : 'ImportSpecifier';
      } else {
        // Pure named import
        specifierType = 'ImportSpecifier';
      }

      return {
        type: specifierType,
        imported: spec.name, // Original name from module
        local: spec.alias || spec.name, // Local name (alias if present, otherwise same as imported)
        isTypeOnly: spec.isTypeOnly,
      };
    }),
    isTypeOnly: node.isTypeOnly,
    metadata: {
      line: node.location?.start?.line ?? 1,
      column: node.location?.start?.column ?? 1,
      sourceLocation: node.location?.start,
    },
  };

  return importIR;
}
