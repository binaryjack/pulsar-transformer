import * as ts from 'typescript';
import { IJSXAnalyzer } from '../jsx-analyzer.types.js';

/**
 * Analyzes JSX children and returns child IR
 */
export const analyzeChildren = function (
  this: IJSXAnalyzer,
  children: ts.NodeArray<ts.JsxChild>
): any[] {
  const result: any[] = [];

  children.forEach((child, index) => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const analyzed = this.analyze(child);
      result.push(analyzed);
    } else if (ts.isJsxExpression(child) && child.expression) {
      // The expression needs to be visited to transform any JSX inside it
      // We'll capture it and let the generator handle visiting it
      const expr = {
        type: 'expression',
        expression: child.expression,
        isStatic: this.isStaticValue(child.expression),
        dependsOn: this.extractDependencies(child.expression),
      };
      result.push(expr);
    } else if (ts.isJsxText(child)) {
      const text = child.text.trim();
      if (text) {
        result.push({
          type: 'text',
          content: text,
          isStatic: true,
        });
      }
    } else if (ts.isJsxFragment(child)) {
      // Handle JSX fragments
      const analyzed = this.analyze(child);
      result.push(analyzed);
    }
  });

  return result;
};
