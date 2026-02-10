/**
 * Analyze function declaration and arrow functions
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeFunctionDeclaration(this: ISemanticAnalyzer, node: any): void {
  // Declare function symbol (if named function)
  if (node.id) {
    const returnType = node.returnType ? this.inferType(node.returnType) : null;
    this.declareSymbol(node.id.name, 'function', returnType, node);
  }

  // Enter function scope
  this.enterScope('function');

  // Declare parameters
  if (node.params) {
    for (const param of node.params) {
      if (param.type === 'Identifier') {
        const paramType = param.typeAnnotation ? this.inferType(param.typeAnnotation) : null;
        this.declareSymbol(param.name, 'parameter', paramType, param);
      } else if (param.type === 'ObjectPattern') {
        // Destructured params
        for (const prop of param.properties) {
          const propType = prop.value.typeAnnotation
            ? this.inferType(prop.value.typeAnnotation)
            : null;
          this.declareSymbol(prop.value.name, 'parameter', propType, prop.value);
        }
      }
    }
  }

  // Analyze body
  if (node.body) {
    if (node.body.type === 'BlockStatement') {
      this.analyzeBlockStatement(node.body);
    } else {
      // Arrow function with expression body
      this.analyzeExpression(node.body);
    }
  }

  // Exit function scope
  this.exitScope();
}
