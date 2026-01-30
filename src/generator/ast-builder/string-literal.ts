/**
 * Create a string literal
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function stringLiteral(text: string): ts.StringLiteral {
  return factory.createStringLiteral(text);
}
