/**
 * Create a conditional expression (ternary)
 * Example: condition ? whenTrue : whenFalse
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function conditional(
  condition: ts.Expression,
  whenTrue: ts.Expression,
  whenFalse: ts.Expression
): ts.ConditionalExpression {
  return factory.createConditionalExpression(
    condition,
    factory.createToken(ts.SyntaxKind.QuestionToken),
    whenTrue,
    factory.createToken(ts.SyntaxKind.ColonToken),
    whenFalse
  );
}
