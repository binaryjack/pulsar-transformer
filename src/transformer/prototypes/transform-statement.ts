/**
 * Transform Statement - Route statement to appropriate transformer
 */

import type { IStatementNode } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform statement by routing to type-specific transformer
 * Uses Strategy Pattern - delegates to appropriate handler
 */
export function transformStatement(this: ITransformer, node: IStatementNode): IStatementNode {
  switch (node.type) {
    case 'ComponentDeclaration':
      return this.transformComponentDeclaration(node as any);

    case 'InterfaceDeclaration':
      return this.transformInterfaceDeclaration(node as any);

    case 'VariableDeclaration':
      return this.transformVariableDeclaration(node as any);

    case 'FunctionDeclaration':
      return this.transformFunctionDeclaration(node as any);

    case 'ExportNamedDeclaration':
      return this.transformExportNamedDeclaration(node as any);

    case 'ImportDeclaration':
    case 'BlockStatement':
    case 'ReturnStatement':
    case 'ExpressionStatement':
    case 'IfStatement':
      // Pass through unchanged
      return node;

    default:
      return node;
  }
}
