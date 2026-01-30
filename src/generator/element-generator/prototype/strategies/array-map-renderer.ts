import * as ts from 'typescript';
import { detectArrayMapPattern } from '../../../../parser/jsx-analyzer/prototype/map-pattern-detector.js';
import { IElementGeneratorInternal } from '../../element-generator.types.js';
import { IChildRenderStrategy } from '../child-render-strategy.types.js';
import { IAnalyzedChild } from '../child-render-utils.js';
import { generateKeyedReconciliation } from '../generate-keyed-map.js';

const factory = ts.factory;

/**
 * Renders array.map() expressions with keyed reconciliation
 * Detects patterns like: items.map(item => <div key={item.id}>{item.name}</div>)
 * Delegates to generateKeyedReconciliation for fine-grained reactivity
 *
 * Pattern: Detects array.map() and uses keyed reconciliation container
 */
export const ArrayMapRenderer: IChildRenderStrategy = {
  name: 'ArrayMapRenderer',

  canHandle(child: IAnalyzedChild): boolean {
    if (child.type !== 'expression') {
      return false;
    }

    const mapPattern = detectArrayMapPattern(child.expression);
    return mapPattern.isMapCall;
  },

  render(
    this: IElementGeneratorInternal,
    child: IAnalyzedChild,
    parentVar: string
  ): ts.Statement[] {
    // Type guard: child must be expression type
    if (child.type !== 'expression') {
      return [];
    }

    // Transform any nested JSX first
    const transformedExpression = this.context.jsxVisitor
      ? (ts.visitNode(child.expression, this.context.jsxVisitor) as ts.Expression)
      : child.expression;

    const mapPattern = detectArrayMapPattern(transformedExpression);

    if (!mapPattern.isMapCall) {
      return [];
    }

    // Generate keyed reconciliation code
    const reconciliationCode = generateKeyedReconciliation({
      mapPattern,
      parentVar,
      varCounter: (this as any).varCounter++,
      elementGenerator: this,
    });

    // Append the reconciliation container to parent
    return [
      factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier(parentVar),
            factory.createIdentifier('appendChild')
          ),
          undefined,
          [reconciliationCode]
        )
      ),
    ];
  },
};
