import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { IElementGenerator } from '../element-generator.types.js';

/**
 * Generates code for dynamic property updates wrapped in createEffect
 * Example output:
 *   createEffect(() => {
 *       el.className = computeClass()
 *   })
 */
export const generateDynamicProps = function (
  this: IElementGenerator,
  elementVar: string,
  elementIR: IJSXElementIR
): ts.Statement[] {
  const factory = ts.factory;
  const statements: ts.Statement[] = [];

  // Handle spread props first (like {...field.register()})
  const spreadProps = elementIR.props.filter((prop) => (prop as any).isSpread);

  spreadProps.forEach((prop) => {
    // Generate code to spread properties, using setAttribute for hyphenated props like aria-*
    // const _spread = spreadExpression;
    // for (const key in _spread) {
    //   if (_spread.hasOwnProperty(key)) {
    //     if (key.includes('-')) {
    //       el.setAttribute(key, _spread[key]);
    //     } else if (key.startsWith('on') && typeof _spread[key] === 'function') {
    //       el[key] = _spread[key];
    //     } else {
    //       el[key] = _spread[key];
    //     }
    //   }
    // }
    const spreadVar = `_spread${statements.length}`;

    statements.push(
      // const _spread = spreadExpression
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier(spreadVar),
              undefined,
              undefined,
              prop.value as ts.Expression
            ),
          ],
          ts.NodeFlags.Const
        )
      )
    );

    statements.push(
      // for (const key in _spread)
      factory.createForInStatement(
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier('key'),
              undefined,
              undefined,
              undefined
            ),
          ],
          ts.NodeFlags.Const
        ),
        factory.createIdentifier(spreadVar),
        factory.createBlock(
          [
            // if (_spread.hasOwnProperty(key))
            factory.createIfStatement(
              factory.createCallExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier(spreadVar),
                  factory.createIdentifier('hasOwnProperty')
                ),
                undefined,
                [factory.createIdentifier('key')]
              ),
              factory.createBlock(
                [
                  // if (key.includes('-')) { el.setAttribute(key, _spread[key]); }
                  // else if (key.startsWith('on') && typeof _spread[key] === 'function') { el[key] = _spread[key]; }
                  // else { el[key] = _spread[key]; }
                  factory.createIfStatement(
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier('key'),
                        factory.createIdentifier('includes')
                      ),
                      undefined,
                      [factory.createStringLiteral('-')]
                    ),
                    factory.createBlock(
                      [
                        factory.createExpressionStatement(
                          factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier(elementVar),
                              factory.createIdentifier('setAttribute')
                            ),
                            undefined,
                            [
                              factory.createIdentifier('key'),
                              factory.createElementAccessExpression(
                                factory.createIdentifier(spreadVar),
                                factory.createIdentifier('key')
                              ),
                            ]
                          )
                        ),
                      ],
                      true
                    ),
                    // else if (key.startsWith('on') && typeof _spread[key] === 'function')
                    // Use key.toLowerCase() for event handlers since DOM expects lowercase
                    factory.createIfStatement(
                      factory.createBinaryExpression(
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createIdentifier('key'),
                            factory.createIdentifier('startsWith')
                          ),
                          undefined,
                          [factory.createStringLiteral('on')]
                        ),
                        factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                        factory.createBinaryExpression(
                          factory.createTypeOfExpression(
                            factory.createElementAccessExpression(
                              factory.createIdentifier(spreadVar),
                              factory.createIdentifier('key')
                            )
                          ),
                          factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                          factory.createStringLiteral('function')
                        )
                      ),
                      factory.createBlock(
                        [
                          factory.createExpressionStatement(
                            factory.createBinaryExpression(
                              factory.createElementAccessExpression(
                                factory.createIdentifier(elementVar),
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier('key'),
                                    factory.createIdentifier('toLowerCase')
                                  ),
                                  undefined,
                                  []
                                )
                              ),
                              factory.createToken(ts.SyntaxKind.EqualsToken),
                              factory.createElementAccessExpression(
                                factory.createIdentifier(spreadVar),
                                factory.createIdentifier('key')
                              )
                            )
                          ),
                        ],
                        true
                      ),
                      // else
                      factory.createBlock(
                        [
                          factory.createExpressionStatement(
                            factory.createBinaryExpression(
                              factory.createElementAccessExpression(
                                factory.createIdentifier(elementVar),
                                factory.createIdentifier('key')
                              ),
                              factory.createToken(ts.SyntaxKind.EqualsToken),
                              factory.createElementAccessExpression(
                                factory.createIdentifier(spreadVar),
                                factory.createIdentifier('key')
                              )
                            )
                          ),
                        ],
                        true
                      )
                    )
                  ),
                ],
                true
              )
            ),
          ],
          true
        )
      )
    );
  });

  // Get all dynamic properties (excluding events, ref, and spreads)
  const dynamicProps = elementIR.props.filter(
    (prop) =>
      prop.isDynamic &&
      !prop.name.startsWith('on') &&
      prop.name !== 'ref' &&
      prop.name !== '__spread' &&
      !(prop as any).isSpread &&
      prop.value
  );

  if (dynamicProps.length === 0) {
    return statements;
  }

  // Generate createEffect for each dynamic property
  dynamicProps.forEach((prop) => {
    // Check if prop name has hyphens (like aria-label) - use setAttribute
    const hasHyphen = prop.name.includes('-');

    let assignmentExpr: ts.Expression;

    if (hasHyphen) {
      // Use setAttribute for hyphenated attributes
      // el.setAttribute('aria-label', value())
      assignmentExpr = factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(elementVar),
          factory.createIdentifier('setAttribute')
        ),
        undefined,
        [factory.createStringLiteral(prop.name), prop.value as ts.Expression]
      );
    } else {
      // Use property assignment for regular properties
      // el.propName = value()
      assignmentExpr = factory.createBinaryExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(elementVar),
          factory.createIdentifier(prop.name)
        ),
        factory.createToken(ts.SyntaxKind.EqualsToken),
        prop.value as ts.Expression
      );
    }

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
            factory.createBlock([factory.createExpressionStatement(assignmentExpr)], true)
          ),
        ])
      )
    );
  });

  return statements;
};
