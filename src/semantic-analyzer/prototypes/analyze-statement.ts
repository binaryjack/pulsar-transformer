/**
 * Analyze statement nodes
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeStatement(this: ISemanticAnalyzer, node: any): void {
  if (!node) return;

  switch (node.type) {
    case 'ComponentDeclaration':
      this.analyzeComponentDeclaration(node);
      break;

    case 'FunctionDeclaration':
      this.analyzeFunctionDeclaration(node);
      break;

    case 'VariableDeclaration':
      this.analyzeVariableDeclaration(node);
      break;

    case 'InterfaceDeclaration':
      this.analyzeInterfaceDeclaration(node);
      break;

    case 'ImportDeclaration':
      // Track imports for unused import detection
      for (const specifier of node.specifiers) {
        this.declareSymbol(specifier.local.name, 'import', null, specifier);
      }
      break;

    case 'ExportDeclaration':
    case 'ExportNamedDeclaration':
      // Analyze exported declaration
      if (node.declaration) {
        this.analyzeStatement(node.declaration);
        // Mark as exported
        const nameNode = node.declaration.id || node.declaration.name;
        if (nameNode) {
          const symbol = this.resolveSymbol(nameNode.name);
          if (symbol) {
            symbol.isExported = true;
          }
        }
      }
      break;

    case 'BlockStatement':
      this.analyzeBlockStatement(node);
      break;

    case 'IfStatement':
      this.analyzeIfStatement(node);
      break;

    case 'ReturnStatement':
      this.analyzeReturnStatement(node);
      break;

    case 'ExpressionStatement':
      if (node.expression) {
        this.analyzeExpression(node.expression);
      }
      break;

    default:
      // Unknown statement type
      break;
  }
}
