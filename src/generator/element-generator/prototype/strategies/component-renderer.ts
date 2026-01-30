import * as ts from 'typescript';
import { IElementGeneratorInternal } from '../../element-generator.types.js';
import { IChildRenderStrategy } from '../child-render-strategy.types.js';
import { IAnalyzedChild, createCompleteValidationCheck } from '../child-render-utils.js';
import { IJSXElementIR } from '../../../../ir/types/index.js';

const factory = ts.factory;

/**
 * Renders component children
 * Generates component call and appends with validation
 *
 * Pattern:
 * const child = generateComponentCall(component)
 * if (child !== null && !== undefined && !== false && (!(child instanceof DocumentFragment) || child.childNodes.length > 0)) {
 *   parent.appendChild(child)
 * }
 */
export const ComponentRenderer: IChildRenderStrategy = {
  name: 'ComponentRenderer',

  canHandle(child: IAnalyzedChild): boolean {
    return child.type === 'component';
  },

  render(
    this: IElementGeneratorInternal,
    child: IAnalyzedChild,
    parentVar: string
  ): ts.Statement[] {
    // Generate component call (child is component IR for type 'component')
    const componentCall = this.generate(child as IJSXElementIR);
    const childVar = `child${(this as any).varCounter++}`;

    return [
      // const child = generateComponentCall(component)
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier(childVar),
              undefined,
              undefined,
              componentCall
            ),
          ],
          ts.NodeFlags.Const
        )
      ),
      // if (child !== null && !== undefined && !== false && not empty fragment)
      factory.createIfStatement(
        createCompleteValidationCheck(childVar),
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(parentVar),
              factory.createIdentifier('appendChild')
            ),
            undefined,
            [factory.createIdentifier(childVar)]
          )
        )
      ),
    ];
  },
};
