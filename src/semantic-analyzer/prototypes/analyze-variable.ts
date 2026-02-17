/**
 * Analyze variable declaration
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeVariableDeclaration(this: ISemanticAnalyzer, node: any): void {
  for (const declarator of node.declarations) {
    // Infer type from annotation or initializer
    let variableType: string | null = null;

    if (declarator.id.typeAnnotation) {
      variableType = this.inferType(declarator.id.typeAnnotation);
    } else if (declarator.init) {
      variableType = this.inferType(declarator.init);
    }

    // Handle different declarator patterns
    if (declarator.id.type === 'Identifier') {
      // Simple: const x = 1
      this.declareSymbol(declarator.id.name, 'variable', variableType, declarator);
    } else if (declarator.id.type === 'ArrayPattern') {
      // Array destructuring: const [count, setCount] = createSignal(0)
      for (const element of declarator.id.elements) {
        if (element && element.type === 'Identifier') {
          this.declareSymbol(element.name, 'variable', null, element);
        }
      }
    } else if (declarator.id.type === 'ObjectPattern') {
      // Object destructuring: const { x, y } = props
      for (const prop of declarator.id.properties) {
        if (prop.value.type === 'Identifier') {
          this.declareSymbol(prop.value.name, 'variable', null, prop.value);
        }
      }
    }

    // Analyze initializer
    if (declarator.init) {
      this.analyzeExpression(declarator.init);
    }
  }
}

