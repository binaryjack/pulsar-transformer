import * as ts from 'typescript';
import { IElementGenerator } from '../element-generator.types.js';

/**
 * Generates code for ref assignment
 * Supports both:
 * 1. Callback refs: ref(el)
 * 2. Object refs (useRef): ref.current = el
 */
export const generateRefAssignment = function (
  this: IElementGenerator,
  elementVar: string,
  refExpr: ts.Expression
): ts.Statement | null {
  const factory = ts.factory;

  // Generate ref handling that supports both patterns:
  // if (typeof ref === 'function') {
  //     ref(el)
  // } else if (ref && typeof ref === 'object' && 'current' in ref) {
  //     ref.current = el
  // }
  return factory.createIfStatement(
    // Check if ref is a function
    factory.createBinaryExpression(
      factory.createTypeOfExpression(refExpr),
      factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
      factory.createStringLiteral('function')
    ),
    // If function, call it with element
    factory.createBlock(
      [
        factory.createExpressionStatement(
          factory.createCallExpression(refExpr, undefined, [factory.createIdentifier(elementVar)])
        ),
      ],
      true
    ),
    // Else check for object ref (useRef pattern)
    factory.createIfStatement(
      factory.createBinaryExpression(
        factory.createBinaryExpression(
          refExpr,
          factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
          factory.createBinaryExpression(
            factory.createTypeOfExpression(refExpr),
            factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
            factory.createStringLiteral('object')
          )
        ),
        factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
        factory.createBinaryExpression(
          factory.createStringLiteral('current'),
          factory.createToken(ts.SyntaxKind.InKeyword),
          refExpr
        )
      ),
      factory.createBlock(
        [
          factory.createExpressionStatement(
            factory.createBinaryExpression(
              factory.createPropertyAccessExpression(refExpr, factory.createIdentifier('current')),
              factory.createToken(ts.SyntaxKind.EqualsToken),
              factory.createIdentifier(elementVar)
            )
          ),
        ],
        true
      )
    )
  );
};
