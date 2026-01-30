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
      // CRITICAL: Visit nested JSX with the transformer to ensure it's transformed
      // This allows <Container><Stack>...</Stack></Container> to work correctly
      const transformedChild = this.context.jsxVisitor
        ? (ts.visitNode(child, this.context.jsxVisitor) as ts.Expression)
        : null;

      if (
        transformedChild &&
        !ts.isJsxElement(transformedChild) &&
        !ts.isJsxSelfClosingElement(transformedChild)
      ) {
        // JSX was transformed to JavaScript - store as expression
        result.push({
          type: 'expression' as const,
          expression: transformedChild,
          isStatic: false,
          dependsOn: [],
        });
      } else {
        // JSX was not transformed (shouldn't happen) - analyze as-is
        const analyzed = this.analyze(child);
        if (analyzed) {
          result.push(analyzed);
        }
      }
    } else if (ts.isJsxExpression(child) && child.expression) {
      // CRITICAL: Visit the expression to transform any nested JSX before analysis
      // This ensures component children JSX is transformed (e.g., <Container><Stack>...</Stack></Container>)
      const visitedExpression = this.context.jsxVisitor
        ? (ts.visitNode(child.expression, this.context.jsxVisitor) as ts.Expression)
        : child.expression;

      const expr: IAnalyzedChildNode = {
        type: 'expression' as const,
        expression: visitedExpression,
        isStatic: this.isStaticValue(visitedExpression),
        dependsOn: this.extractDependencies(visitedExpression),
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
