import * as ts from 'typescript';
import { IChildRenderStrategy } from '../child-render-strategy.types.js';
import { IAnalyzedChild } from '../child-render-utils.js';

const factory = ts.factory;

/**
 * Renders static text nodes
 * Pattern: parent.appendChild(document.createTextNode('text'))
 */
export const TextNodeRenderer: IChildRenderStrategy = {
  name: 'TextNodeRenderer',

  canHandle(child: IAnalyzedChild): boolean {
    return child.type === 'text';
  },

  render(child: IAnalyzedChild, parentVar: string): ts.Statement[] {
    // Type guard: child is guaranteed to be text type here
    if (child.type !== 'text') {
      return [];
    }

    return [
      factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier(parentVar),
            factory.createIdentifier('appendChild')
          ),
          undefined,
          [
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('document'),
                factory.createIdentifier('createTextNode')
              ),
              undefined,
              [factory.createStringLiteral(child.content)]
            ),
          ]
        )
      ),
    ];
  },
};
