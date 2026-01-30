import * as ts from 'typescript';
import { IAnalyzedChildNode, IJSXAnalyzer } from '../jsx-analyzer.types.js';

/**
 * Analyzes children of JSX elements
 */
export const analyzeChildren = function (
  this: IJSXAnalyzer,
  children: ts.NodeArray<ts.JsxChild>
): IAnalyzedChildNode[] {
  const result: IAnalyzedChildNode[] = [];

  children.forEach((child, index) => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const analyzed = this.analyze(child);
      if (analyzed) {
        result.push(analyzed);
      }
    } else if (ts.isJsxExpression(child) && child.expression) {
      // The expression needs to be visited to transform any JSX inside it
      // We'll capture it and let the generator handle visiting it
      const expr: IAnalyzedChildNode = {
        type: 'expression' as const,
        expression: child.expression,
        isStatic: this.isStaticValue(child.expression),
        dependsOn: this.extractDependencies(child.expression),
      };
      result.push(expr);
    } else if (ts.isJsxText(child)) {
      const text = child.text.trim();
      if (text) {
        result.push({
          type: 'text' as const,
          content: text,
          isStatic: true as const,
        });
      }
    } else if (ts.isJsxFragment(child)) {
      // Handle JSX fragments
      const analyzed = this.analyze(child);
      if (analyzed) {
        result.push(analyzed);
      }
    }
  });

  return result;
};
