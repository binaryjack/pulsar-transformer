import * as ts from 'typescript';
import { detectArrayMapPattern } from '../../../parser/jsx-analyzer/prototype/map-pattern-detector.js';
import { IElementGeneratorInternal } from '../element-generator.types.js';
import { generateKeyedReconciliation } from './generate-keyed-map.js';

/**
 * Generates code for appending children to an element
 * Handles text nodes, static elements, and dynamic expressions
 */
export const generateChildren = function (
  this: IElementGeneratorInternal,
  children: any[],
  parentVar: string
): ts.Statement[] {
  const factory = ts.factory;
  const statements: ts.Statement[] = [];

  children.forEach((child) => {
    if (child.type === 'text') {
      // Static text: parent.appendChild(document.createTextNode('text'))
      statements.push(
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
        )
      );
    } else if (child.type === 'expression') {
      // Transform any JSX inside the expression first
      const transformedExpression = this.context.jsxVisitor
        ? (ts.visitNode(child.expression, this.context.jsxVisitor) as ts.Expression)
        : (child.expression as ts.Expression);

      // 🎯 DETECT ARRAY.MAP() PATTERN FOR FINE-GRAINED REACTIVITY
      const mapPattern = detectArrayMapPattern(transformedExpression);

      if (mapPattern.isMapCall) {
        // Use keyed reconciliation for fine-grained updates
        const reconciliationCode = generateKeyedReconciliation({
          mapPattern,
          parentVar,
          varCounter: (this as any).varCounter++,
          elementGenerator: this,
        });

        // Append the reconciliation container to parent
        statements.push(
          factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier(parentVar),
                factory.createIdentifier('appendChild')
              ),
              undefined,
              [reconciliationCode]
            )
          )
        );
        return; // Skip the old array handling below
      }

      if (child.isStatic) {
        // Static expression could be a string/number OR an array of elements OR a function (deferred children)
        // We need to handle all cases at runtime:
        // if (typeof expr === 'function') { const result = expr(); handle result recursively }
        // else if (Array.isArray(expr)) { expr.forEach(el => parent.appendChild(el)) }
        // else { parent.appendChild(document.createTextNode(String(expr))) }

        const resultVar = `childResult${(this as any).varCounter++}`;
        const evalVar = `evaluated${(this as any).varCounter++}`;

        statements.push(
          // const childResult = transformedExpression
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
          ),
          // const evaluated = typeof childResult === 'function' ? childResult() : childResult
          factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  factory.createIdentifier(evalVar),
                  undefined,
                  undefined,
                  factory.createConditionalExpression(
                    factory.createBinaryExpression(
                      factory.createTypeOfExpression(factory.createIdentifier(resultVar)),
                      factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                      factory.createStringLiteral('function')
                    ),
                    factory.createToken(ts.SyntaxKind.QuestionToken),
                    factory.createCallExpression(
                      factory.createIdentifier(resultVar),
                      undefined,
                      []
                    ),
                    factory.createToken(ts.SyntaxKind.ColonToken),
                    factory.createIdentifier(resultVar)
                  )
                ),
              ],
              ts.NodeFlags.Const
            )
          ),
          // if (Array.isArray(evaluated))
          factory.createIfStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('Array'),
                factory.createIdentifier('isArray')
              ),
              undefined,
              [factory.createIdentifier(evalVar)]
            ),
            // then: append each element
            factory.createBlock(
              [
                factory.createExpressionStatement(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier(evalVar),
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
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createIdentifier(parentVar),
                            factory.createIdentifier('appendChild')
                          ),
                          undefined,
                          [factory.createIdentifier('el')]
                        )
                      ),
                    ]
                  )
                ),
              ],
              true
            ),
            // else: append as text node or HTMLElement (if not null/undefined/false)
            factory.createBlock(
              [
                factory.createIfStatement(
                  factory.createBinaryExpression(
                    factory.createBinaryExpression(
                      factory.createBinaryExpression(
                        factory.createIdentifier(evalVar),
                        factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                        factory.createNull()
                      ),
                      factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                      factory.createBinaryExpression(
                        factory.createIdentifier(evalVar),
                        factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                        factory.createIdentifier('undefined')
                      )
                    ),
                    factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                    factory.createBinaryExpression(
                      factory.createIdentifier(evalVar),
                      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                      factory.createFalse()
                    )
                  ),
                  factory.createExpressionStatement(
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier(parentVar),
                        factory.createIdentifier('appendChild')
                      ),
                      undefined,
                      [
                        // If it's already an HTMLElement, append it directly; otherwise, create text node
                        factory.createConditionalExpression(
                          factory.createBinaryExpression(
                            factory.createIdentifier(evalVar),
                            factory.createToken(ts.SyntaxKind.InstanceOfKeyword),
                            factory.createIdentifier('HTMLElement')
                          ),
                          factory.createToken(ts.SyntaxKind.QuestionToken),
                          factory.createIdentifier(evalVar),
                          factory.createToken(ts.SyntaxKind.ColonToken),
                          factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier('document'),
                              factory.createIdentifier('createTextNode')
                            ),
                            undefined,
                            [
                              factory.createCallExpression(
                                factory.createIdentifier('String'),
                                undefined,
                                [factory.createIdentifier(evalVar)]
                              ),
                            ]
                          )
                        ),
                      ]
                    )
                  )
                ),
              ],
              true
            )
          )
        );
      } else {
        // Dynamic expression: wrap in createEffect
        // Track previous elements to avoid clearing siblings
        // let currentElements = []
        // createEffect(() => {
        //     const rawResult = expr
        //     const result = typeof rawResult === 'function' ? rawResult() : rawResult
        //     // Remove previous elements
        //     currentElements.forEach(el => parent.removeChild(el))
        //     currentElements = []
        //     // Add new elements
        //     if (Array.isArray(result)) {
        //         result.forEach(el => { parent.appendChild(el); currentElements.push(el) })
        //     } else if (result instanceof HTMLElement) {
        //         parent.appendChild(result)
        //         currentElements.push(result)
        //     } else if (result != null && result !== false && result !== undefined) {
        //         const textNode = document.createTextNode(String(result))
        //         parent.appendChild(textNode)
        //         currentElements.push(textNode)
        //     }
        // })
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
                    // const rawResult = expr
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
                            factory.createConditionalExpression(
                              factory.createBinaryExpression(
                                factory.createTypeOfExpression(
                                  factory.createIdentifier('rawResult')
                                ),
                                factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                factory.createStringLiteral('function')
                              ),
                              factory.createToken(ts.SyntaxKind.QuestionToken),
                              factory.createCallExpression(
                                factory.createIdentifier('rawResult'),
                                undefined,
                                []
                              ),
                              factory.createToken(ts.SyntaxKind.ColonToken),
                              factory.createIdentifier('rawResult')
                            )
                          ),
                        ],
                        ts.NodeFlags.Const
                      )
                    ),
                    // Remove previous elements: currentElements.forEach(el => parent.removeChild(el))
                    factory.createExpressionStatement(
                      factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                          factory.createIdentifier(currentElementsVar),
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
                            factory.createCallExpression(
                              factory.createPropertyAccessExpression(
                                factory.createIdentifier(parentVar),
                                factory.createIdentifier('removeChild')
                              ),
                              undefined,
                              [factory.createIdentifier('el')]
                            )
                          ),
                        ]
                      )
                    ),
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
                      factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                          factory.createIdentifier('Array'),
                          factory.createIdentifier('isArray')
                        ),
                        undefined,
                        [factory.createIdentifier('result')]
                      ),
                      // then: append each element and track it
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
                              ]
                            )
                          ),
                        ],
                        true
                      ),
                      // else: check if HTMLElement or text (skip false/null/undefined)
                      factory.createBlock(
                        [
                          factory.createIfStatement(
                            factory.createBinaryExpression(
                              factory.createBinaryExpression(
                                factory.createBinaryExpression(
                                  factory.createIdentifier('result'),
                                  factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                                  factory.createNull()
                                ),
                                factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                                factory.createBinaryExpression(
                                  factory.createIdentifier('result'),
                                  factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                                  factory.createIdentifier('undefined')
                                )
                              ),
                              factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                              factory.createBinaryExpression(
                                factory.createIdentifier('result'),
                                factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
                                factory.createFalse()
                              )
                            ),
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
                                        factory.createConditionalExpression(
                                          factory.createBinaryExpression(
                                            factory.createIdentifier('result'),
                                            factory.createToken(ts.SyntaxKind.InstanceOfKeyword),
                                            factory.createIdentifier('HTMLElement')
                                          ),
                                          factory.createToken(ts.SyntaxKind.QuestionToken),
                                          factory.createIdentifier('result'),
                                          factory.createToken(ts.SyntaxKind.ColonToken),
                                          factory.createCallExpression(
                                            factory.createPropertyAccessExpression(
                                              factory.createIdentifier('document'),
                                              factory.createIdentifier('createTextNode')
                                            ),
                                            undefined,
                                            [
                                              factory.createCallExpression(
                                                factory.createIdentifier('String'),
                                                undefined,
                                                [factory.createIdentifier('result')]
                                              ),
                                            ]
                                          )
                                        )
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
      }
    } else if (child.type === 'element') {
      // Nested element: recursively generate and append
      const childElement = this.generate(child);
      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(parentVar),
              factory.createIdentifier('appendChild')
            ),
            undefined,
            [childElement]
          )
        )
      );
    } else if (child.type === 'component') {
      // Component child: generate component call and append
      const componentCall = this.generate(child);
      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(parentVar),
              factory.createIdentifier('appendChild')
            ),
            undefined,
            [componentCall]
          )
        )
      );
    }
  });

  return statements;
};
