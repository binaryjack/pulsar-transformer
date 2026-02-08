/**
 * Analyze Export Declaration
 *
 * Converts export AST nodes to IR representation.
 *
 * @example
 * export { foo, bar };
 * export { foo as bar };
 * export * from './utils';
 */

import type { IExportDeclarationNode } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { IExportIR, IExportSpecifierIR } from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze export declaration
 */
export function analyzeExport(this: IAnalyzerInternal, node: IExportDeclarationNode): IExportIR {
  const specifiers: IExportSpecifierIR[] = [];

  // Handle named exports with specifiers
  if (node.specifiers && node.specifiers.length > 0) {
    for (const spec of node.specifiers) {
      const exportedName = spec.alias || spec.name;
      const localName = spec.name;

      specifiers.push({
        type: 'ExportSpecifier' as const,
        exported: exportedName,
        local: localName,
        isTypeOnly: spec.isTypeOnly,
      });

      // Track exported name in context
      if (!node.source) {
        // Local export - track the name
        this._context.exports.add(exportedName);
      }
    }
  }

  // Handle default exports
  if (node.exportKind === 'default') {
    this._context.exports.add('default');

    // If there's a specifier (identifier being exported), include it
    if (node.specifiers && node.specifiers.length > 0) {
      const defaultIdentifier = node.specifiers[0].name;
      specifiers.push({
        type: 'ExportSpecifier' as const,
        exported: 'default',
        local: defaultIdentifier,
        isTypeOnly: false,
      });
    }
  }

  return {
    type: IRNodeType.EXPORT,
    exportKind: node.exportKind || 'named',
    specifiers,
    source: node.source ? String(node.source.value) : null,
    isTypeOnly: node.isTypeOnly,
    metadata: {
      sourceLocation: node.location?.start,
    },
  };
}
