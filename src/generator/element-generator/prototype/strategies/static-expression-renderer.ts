import * as ts from 'typescript';
import { IElementGeneratorInternal } from '../../element-generator.types.js';
import { IChildRenderStrategy } from '../child-render-strategy.types.js';
import {
  IAnalyzedChild,
  createArrayForEachAppend,
  createElementOrTextNode,
  createEvaluateIfFunction,
  createIsArrayCheck,
  createNullFalseCheck,
} from '../child-render-utils.js';

const factory = ts.factory;

/**
 * Renders static expressions (strings, numbers, arrays, elements)
 * No createEffect wrapper - evaluates once at creation time
 *
 * Pattern:
 * const childResult = expression
 * const evaluated = typeof childResult === 'function' ? childResult() : childResult
 * if (Array.isArray(evaluated)) {
 *   evaluated.forEach(el => { if (el !== null && !== undefined && !== false) parent.appendChild(el) })
 * } else if (evaluated !== null && !== undefined && !== false) {
 *   parent.appendChild(evaluated instanceof HTMLElement ? evaluated : document.createTextNode(String(evaluated)))
 * }
 */
export const StaticExpressionRenderer: IChildRenderStrategy = {
  name: 'StaticExpressionRenderer',

  canHandle(child: IAnalyzedChild): boolean {
    return child.type === 'expression' && child.isStatic === true;
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

    const statements: ts.Statement[] = [];

    // Transform any nested JSX first
    const transformedExpression = this.context.jsxVisitor
      ? (ts.visitNode(child.expression, this.context.jsxVisitor) as ts.Expression)
      : child.expression;

    // Generate unique variable names
    const resultVar = `childResult${(this as any).varCounter++}`;
    const evalVar = `evaluated${(this as any).varCounter++}`;

    // const childResult = expression
    statements.push(
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier(resultVar),
              undefined,
              undefined,
              transformedExpression
            ),
          ],
          ts.NodeFlags.Const
        )
      )
    );

    // const evaluated = typeof childResult === 'function' ? childResult() : childResult
    statements.push(
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier(evalVar),
              undefined,
              undefined,
              createEvaluateIfFunction(resultVar)
            ),
          ],
          ts.NodeFlags.Const
        )
      )
    );

    // if (Array.isArray(evaluated))
    statements.push(
      factory.createIfStatement(
        createIsArrayCheck(evalVar),
        // then: forEach with null/false filtering
        factory.createBlock([createArrayForEachAppend(evalVar, parentVar)], true),
        // else: append single value (if not null/undefined/false)
        factory.createBlock(
          [
            factory.createIfStatement(
              createNullFalseCheck(evalVar),
              factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier(parentVar),
                    factory.createIdentifier('appendChild')
                  ),
                  undefined,
                  [createElementOrTextNode(evalVar)]
                )
              )
            ),
          ],
          true
        )
      )
    );

    return statements;
  },
};
