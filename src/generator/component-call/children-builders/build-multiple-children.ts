import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { elementOrTextNode, notNullUndefinedFalse } from '../../ast-builder/index.js';
import { IComponentCallContext } from '../component-call-generator.types.js';

/**
 * Builds container with multiple children
 * Creates div, appends all children with null checks
 */
export const buildMultipleChildren = function (
  children: IJSXElementIR['children'],
  context: IComponentCallContext,
  generateElement: (ir: IJSXElementIR, context: IComponentCallContext) => ts.Expression
): ts.Expression {
  const statements: ts.Statement[] = [];
  const containerVar = `container${context.varCounter++}`;

  // Create container element
  statements.push(
    context.factory.createVariableStatement(
      undefined,
      context.factory.createVariableDeclarationList(
        [
          context.factory.createVariableDeclaration(
            context.factory.createIdentifier(containerVar),
            undefined,
            undefined,
            context.factory.createCallExpression(
              context.factory.createPropertyAccessExpression(
                context.factory.createIdentifier('document'),
                context.factory.createIdentifier('createElement')
              ),
              undefined,
              [context.factory.createStringLiteral('div')]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // Append each child with null/false checks and array flattening
  children.forEach((child) => {
    const childExpr = buildChildExpression(child, context, generateElement);
    const needsNullCheck = child.type === 'expression';

    if (needsNullCheck) {
      // Expression children might be false/null/undefined OR an array (from .map())
      const tempVar = `_child${context.varCounter++}`;

      statements.push(
        context.factory.createVariableStatement(
          undefined,
          context.factory.createVariableDeclarationList(
            [
              context.factory.createVariableDeclaration(
                context.factory.createIdentifier(tempVar),
                undefined,
                undefined,
                childExpr
              ),
            ],
            ts.NodeFlags.Const
          )
        )
      );

      // Handle arrays (from .map()) - flatten and append each element
      statements.push(
        context.factory.createIfStatement(
          // Check if it's an array
          context.factory.createCallExpression(
            context.factory.createPropertyAccessExpression(
              context.factory.createIdentifier('Array'),
              context.factory.createIdentifier('isArray')
            ),
            undefined,
            [context.factory.createIdentifier(tempVar)]
          ),
          // If array: forEach and appendChild
          context.factory.createBlock(
            [
              context.factory.createExpressionStatement(
                context.factory.createCallExpression(
                  context.factory.createPropertyAccessExpression(
                    context.factory.createIdentifier(tempVar),
                    context.factory.createIdentifier('forEach')
                  ),
                  undefined,
                  [
                    context.factory.createArrowFunction(
                      undefined,
                      undefined,
                      [
                        context.factory.createParameterDeclaration(
                          undefined,
                          undefined,
                          context.factory.createIdentifier('_el')
                        ),
                      ],
                      undefined,
                      context.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                      context.factory.createBlock(
                        [
                          context.factory.createIfStatement(
                            notNullUndefinedFalse('_el'),
                            context.factory.createExpressionStatement(
                              context.factory.createCallExpression(
                                context.factory.createPropertyAccessExpression(
                                  context.factory.createIdentifier(containerVar),
                                  context.factory.createIdentifier('appendChild')
                                ),
                                undefined,
                                [elementOrTextNode('_el')]
                              )
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
          // Else: append single element
          context.factory.createIfStatement(
            notNullUndefinedFalse(tempVar),
            context.factory.createBlock(
              [
                context.factory.createExpressionStatement(
                  context.factory.createCallExpression(
                    context.factory.createPropertyAccessExpression(
                      context.factory.createIdentifier(containerVar),
                      context.factory.createIdentifier('appendChild')
                    ),
                    undefined,
                    [elementOrTextNode(tempVar)]
                  )
                ),
              ],
              true
            )
          )
        )
      );
    } else {
      // Static child - append directly
      statements.push(
        context.factory.createExpressionStatement(
          context.factory.createCallExpression(
            context.factory.createPropertyAccessExpression(
              context.factory.createIdentifier(containerVar),
              context.factory.createIdentifier('appendChild')
            ),
            undefined,
            [childExpr]
          )
        )
      );
    }
  });

  // Return container
  statements.push(
    context.factory.createReturnStatement(context.factory.createIdentifier(containerVar))
  );

  // Wrap in IIFE
  return context.factory.createCallExpression(
    context.factory.createParenthesizedExpression(
      context.factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        context.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        context.factory.createBlock(statements, true)
      )
    ),
    undefined,
    []
  );
};

/**
 * Helper: Build expression for a child node
 */
const buildChildExpression = function (
  child: IJSXElementIR['children'][0],
  context: IComponentCallContext,
  generateElement: (ir: IJSXElementIR, context: IComponentCallContext) => ts.Expression
): ts.Expression {
  if (child.type === 'text') {
    return context.factory.createCallExpression(
      context.factory.createPropertyAccessExpression(
        context.factory.createIdentifier('document'),
        context.factory.createIdentifier('createTextNode')
      ),
      undefined,
      [context.factory.createStringLiteral(child.content)]
    );
  }

  if (child.type === 'expression') {
    return context.jsxVisitor
      ? (ts.visitNode(child.expression, context.jsxVisitor) as ts.Expression)
      : child.expression;
  }

  return generateElement(child as IJSXElementIR, context);
};
