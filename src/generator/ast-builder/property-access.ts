/**
 * Create property access
 * Example: object.property
 */
import * as ts from 'typescript';
import { identifier } from './identifier.js';

const factory = ts.factory;

export function propertyAccess(
  objectName: string,
  propertyName: string
): ts.PropertyAccessExpression {
  return factory.createPropertyAccessExpression(identifier(objectName), identifier(propertyName));
}
