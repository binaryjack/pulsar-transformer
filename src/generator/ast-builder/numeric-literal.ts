/**
 * Create a numeric literal
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function numericLiteral(value: number): ts.NumericLiteral {
  return factory.createNumericLiteral(value);
}
