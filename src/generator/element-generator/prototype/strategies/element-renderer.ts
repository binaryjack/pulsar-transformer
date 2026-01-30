import * as ts from 'typescript';
import { IElementGeneratorInternal } from '../../element-generator.types.js';
import { IChildRenderStrategy } from '../child-render-strategy.types.js';
import { IAnalyzedChild, createCompleteValidationCheck } from '../child-render-utils.js';
import { IJSXElementIR } from '../../../../ir/types/index.js';

const factory = ts.factory;

/**
 * Renders nested element children
 * Recursively generates element and appends with validation
 *
 * Pattern:
 * const child = generate(element)
 * if (child !== null && !== undefined && !== false && (!(child instanceof DocumentFragment) || child.childNodes.length > 0)) {
 *   parent.appendChild(child)
 * }
 */
export const ElementRenderer: IChildRenderStrategy = {
  name: 'ElementRenderer',

  canHandle(child: IAnalyzedChild): boolean {
    return child.type === 'element';
  },

  render(
    this: IElementGeneratorInternal,
    child: IAnalyzedChild,
    parentVar: string
  ): ts.Statement[] {
    // Recursively generate the element (child is IJSXElementIR for type 'element'|'fragment'|'component')
    const childElement = this.generate(child as IJSXElementIR);
    const childVar = `child${(this as any).varCounter++}`;

    return [
      // const child = generate(element)
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier(childVar),
              undefined,
              undefined,
              childElement
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
