/**
 * Transform Export Named Declaration
 * Handle exported components and other declarations
 */

import type { IExportNamedDeclaration } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform export named declaration
 * If declaration is a ComponentDeclaration, transform it
 * Otherwise pass through
 */
export function transformExportNamedDeclaration(
  this: ITransformer,
  node: IExportNamedDeclaration
): IExportNamedDeclaration {
  if (!node.declaration) {
    return node;
  }

  // If exporting a component, transform it but keep the export wrapper
  if (node.declaration.type === 'ComponentDeclaration') {
    const transformedComponent = this.transformComponentDeclaration(node.declaration as any);

    // Mark as exported
    (transformedComponent as any).exported = true;

    // Return the transformed component directly (already marked as exported)
    // We return it as the export declaration
    return {
      ...node,
      declaration: transformedComponent as any,
    };
  }

  // For other declarations, pass through
  return node;
}
