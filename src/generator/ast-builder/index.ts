/**
 * AST Builder - Simplified API for TypeScript AST construction
 *
 * Provides individual utility functions for creating TypeScript AST nodes.
 * Hides the complexity of the TypeScript factory API.
 *
 * Each function is in its own file following the feature slice pattern.
 */

export { appendChild } from './append-child.js';
export { arrayLiteral } from './array-literal.js';
export { arrowFunction } from './arrow-function.js';
export { binaryExpression } from './binary-expression.js';
export { block } from './block.js';
export { conditional } from './conditional.js';
export { createElement } from './create-element.js';
export { createTextNode } from './create-text-node.js';
export { createVariable } from './create-variable.js';
export { elementOrTextNode } from './element-or-text-node.js';
export { functionCall } from './function-call.js';
export { identifier } from './identifier.js';
export { ifStatement } from './if-statement.js';
export { instanceofCheck } from './instanceof-check.js';
export { isArrayCheck } from './is-array-check.js';
export { methodCallStatement } from './method-call-statement.js';
export { methodCall } from './method-call.js';
export { notNullUndefinedFalse } from './not-null-undefined-false.js';
export { numericLiteral } from './numeric-literal.js';
export { objectLiteral } from './object-literal.js';
export { parameter } from './parameter.js';
export { propertyAccess } from './property-access.js';
export { propertyAssignment } from './property-assignment.js';
export { removeChild } from './remove-child.js';
export { returnStatement } from './return-statement.js';
export { stringLiteral } from './string-literal.js';
export { typeofCheck } from './typeof-check.js';
