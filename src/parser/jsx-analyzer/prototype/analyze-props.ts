import * as ts from 'typescript';
import { IPropIR } from '../../../ir/types/index.js';
import { IJSXAnalyzer } from '../jsx-analyzer.types.js';

/**
 * Analyzes JSX attributes and returns property IR
 */
export const analyzeProps = function (this: IJSXAnalyzer, attributes: ts.JsxAttributes): IPropIR[] {
  const props: IPropIR[] = [];

  // Safety check
  if (!attributes || !attributes.properties) {
    return props;
  }

  attributes.properties.forEach((prop) => {
    if (ts.isJsxAttribute(prop)) {
      const name = ts.isIdentifier(prop.name) ? prop.name.text : 'unknown';
      const initializer = prop.initializer;

      if (initializer) {
        // Extract the actual expression from JsxExpression wrapper
        let value: ts.Expression | undefined;

        if (ts.isJsxExpression(initializer)) {
          // JsxExpression wraps the actual expression
          // Skip if the expression is undefined (empty JSX expression like value={})
          if (!initializer.expression) {
            return;
          }
          value = initializer.expression;
        } else if (ts.isStringLiteral(initializer) || ts.isNumericLiteral(initializer)) {
          // Direct literal values
          value = initializer;
        } else {
          // Other expression types
          value = initializer as ts.Expression;
        }

        // Final validation - skip if we don't have a valid expression
        if (!value || typeof value !== 'object' || !(value as any).kind) {
          return;
        }

        const isStatic = ts.isStringLiteral(initializer) || ts.isNumericLiteral(initializer);

        props.push({
          name,
          value,
          isStatic,
          isDynamic: !isStatic,
          dependsOn: isStatic ? [] : this.extractDependencies(initializer),
        });
      }
    } else if (ts.isJsxSpreadAttribute(prop)) {
      // Handle spread attributes like {...field.register()}
      props.push({
        name: '__spread',
        value: prop.expression,
        isStatic: false,
        isDynamic: true,
        isSpread: true,
        dependsOn: this.extractDependencies(prop.expression),
      });
    }
  });

  return props;
};
