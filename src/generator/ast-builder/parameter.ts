/**
 * Create parameter declaration
 */
import * as ts from 'typescript';
import { identifier } from './identifier.js';

const factory = ts.factory;

export function parameter(name: string, type?: ts.TypeNode): ts.ParameterDeclaration {
  return factory.createParameterDeclaration(
    undefined,
    undefined,
    identifier(name),
    undefined,
    type
  );
}
