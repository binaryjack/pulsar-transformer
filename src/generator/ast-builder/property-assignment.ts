/**
 * Create property assignment
 * Example: { key: value }
 */
import * as ts from 'typescript';
import { identifier } from './identifier.js';

const factory = ts.factory;

export function propertyAssignment(name: string, value: ts.Expression): ts.PropertyAssignment {
  return factory.createPropertyAssignment(identifier(name), value);
}
