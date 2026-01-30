/**
 * Create arrow function
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function arrowFunction(
  parameters: ts.ParameterDeclaration[],
  body: ts.Block | ts.Expression
): ts.ArrowFunction {
  return factory.createArrowFunction(
    undefined,
    undefined,
    parameters,
    undefined,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    body
  );
}
