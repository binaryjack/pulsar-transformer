/**
 * Create an identifier
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function identifier(name: string): ts.Identifier {
  return factory.createIdentifier(name);
}
