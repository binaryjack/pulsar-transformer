import * as ts from 'typescript';
import { IElementGeneratorInternal } from '../../element-generator.types.js';
import { IChildRenderStrategy } from '../child-render-strategy.types.js';
import {
  IAnalyzedChild,
  createArrayForEachRemove,
  createElementOrTextNode,
  createEvaluateIfFunction,
  createIsArrayCheck,
  createNullFalseCheck,
} from '../child-render-utils.js';

const factory = ts.factory;

/**
 * Renders dynamic expressions wrapped in createEffect for reactivity
 * Tracks previously rendered elements to enable updates without clearing siblings
 *
 * Pattern:
 * let currentElements = []
 * createEffect(() => {
 *   const rawResult = expression
 *   const result = typeof rawResult === 'function' ? rawResult() : rawResult
 *   // Remove previous elements
 *   currentElements.forEach(el => parent.removeChild(el))
 *   currentElements = []
 *   // Add new elements
 *   if (Array.isArray(result)) {
 *     result.forEach(el => {
 *       if (el !== null && !== undefined && !== false) {
 *         parent.appendChild(el)
 *         currentElements.push(el)
 *       }
 *     })
 *   } else if (result !== null && !== undefined && !== false) {
 *     const newElement = result instanceof HTMLElement ? result : document.createTextNode(String(result))
 *     parent.appendChild(newElement)
 *     currentElements.push(newElement)
 *   }
 * })
 */
export const DynamicExpressionRenderer: IChildRenderStrategy = {
  name: 'DynamicExpressionRenderer',

  canHandle(child: IAnalyzedChild): boolean {
    return child.type === 'expression' && child.isStatic === false;
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

    const currentElementsVar = `_currentElements${(this as any).varCounter++}`;

    // let currentElements = []
    statements.push(
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier(currentElementsVar),
              undefined,
              undefined,
              factory.createArrayLiteralExpression([], false)
            ),
          ],
          ts.NodeFlags.Let
        )
      )
    );

    // createEffect(() => { ... })
    statements.push(
      factory.createExpressionStatement(
        factory.createCallExpression(factory.createIdentifier('createEffect'), undefined, [
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createBlock(
              [
                // const rawResult = expression
                factory.createVariableStatement(
                  undefined,
                  factory.createVariableDeclarationList(
                    [
                      factory.createVariableDeclaration(
                        factory.createIdentifier('rawResult'),
                        undefined,
                        undefined,
                        transformedExpression
                      ),
                    ],
                    ts.NodeFlags.Const
                  )
                ),
                // const result = typeof rawResult === 'function' ? rawResult() : rawResult
                factory.createVariableStatement(
                  undefined,
                  factory.createVariableDeclarationList(
                    [
                      factory.createVariableDeclaration(
                        factory.createIdentifier('result'),
                        undefined,
                        undefined,
                        createEvaluateIfFunction('rawResult')
                      ),
                    ],
                    ts.NodeFlags.Const
                  )
                ),
                // Remove previous elements
                createArrayForEachRemove(currentElementsVar, parentVar),
                // currentElements = []
                factory.createExpressionStatement(
                  factory.createBinaryExpression(
                    factory.createIdentifier(currentElementsVar),
                    factory.createToken(ts.SyntaxKind.EqualsToken),
                    factory.createArrayLiteralExpression([], false)
                  )
                ),
                // if (Array.isArray(result))
                factory.createIfStatement(
                  createIsArrayCheck('result'),
                  // then: forEach to append and track each element
                  factory.createBlock(
                    [
                      factory.createExpressionStatement(
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createIdentifier('result'),
                            factory.createIdentifier('forEach')
                          ),
                          undefined,
                          [
                            factory.createArrowFunction(
                              undefined,
                              undefined,
                              [
                                factory.createParameterDeclaration(
                                  undefined,
                                  undefined,
                                  factory.createIdentifier('el')
                                ),
                              ],
                              undefined,
                              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                              factory.createBlock(
                                [
                                  factory.createIfStatement(
                                    createNullFalseCheck('el'),
                                    factory.createBlock(
                                      [
                                        // parent.appendChild(el)
                                        factory.createExpressionStatement(
                                          factory.createCallExpression(
                                            factory.createPropertyAccessExpression(
                                              factory.createIdentifier(parentVar),
                                              factory.createIdentifier('appendChild')
                                            ),
                                            undefined,
                                            [factory.createIdentifier('el')]
                                          )
                                        ),
                                        // currentElements.push(el)
                                        factory.createExpressionStatement(
                                          factory.createCallExpression(
                                            factory.createPropertyAccessExpression(
                                              factory.createIdentifier(currentElementsVar),
                                              factory.createIdentifier('push')
                                            ),
                                            undefined,
                                            [factory.createIdentifier('el')]
                                          )
                                        ),
                                      ],
                                      true
                                    )
                                  ),
                                ],
                                true
                              )
                            ),
                          ]
                        )
                      ),
                    ],
                    true
                  ),
                  // else: single value (not array)
                  factory.createBlock(
                    [
                      factory.createIfStatement(
                        createNullFalseCheck('result'),
                        factory.createBlock(
                          [
                            // const newElement = result instanceof HTMLElement ? result : document.createTextNode(String(result))
                            factory.createVariableStatement(
                              undefined,
                              factory.createVariableDeclarationList(
                                [
                                  factory.createVariableDeclaration(
                                    factory.createIdentifier('newElement'),
                                    undefined,
                                    undefined,
                                    createElementOrTextNode('result')
                                  ),
                                ],
                                ts.NodeFlags.Const
                              )
                            ),
                            // parent.appendChild(newElement)
                            factory.createExpressionStatement(
                              factory.createCallExpression(
                                factory.createPropertyAccessExpression(
                                  factory.createIdentifier(parentVar),
                                  factory.createIdentifier('appendChild')
                                ),
                                undefined,
                                [factory.createIdentifier('newElement')]
                              )
                            ),
                            // currentElements.push(newElement)
                            factory.createExpressionStatement(
                              factory.createCallExpression(
                                factory.createPropertyAccessExpression(
                                  factory.createIdentifier(currentElementsVar),
                                  factory.createIdentifier('push')
                                ),
                                undefined,
                                [factory.createIdentifier('newElement')]
                              )
                            ),
                          ],
                          true
                        )
                      ),
                    ],
                    true
                  )
                ),
              ],
              true
            )
          ),
        ])
      )
    );

    return statements;
  },
};
