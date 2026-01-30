import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { IComponentCallContext } from '../component-call-generator.types.js';
import { buildMultipleChildren } from './build-multiple-children.js';
import { buildSingleChild } from './build-single-child.js';

/**
 * Builds deferred children for Provider components
 * Wraps children in arrow function: () => children
 */
export const buildDeferredChildren = function (
  children: IJSXElementIR['children'],
  context: IComponentCallContext,
  generateElement: (ir: IJSXElementIR, context: IComponentCallContext) => ts.Expression
): ts.Expression {
  const statements: ts.Statement[] = [];

  if (children.length === 1) {
    // Single child - just return it
    const child = children[0];
    const childExpr = buildSingleChild(child, context, generateElement);
    statements.push(context.factory.createReturnStatement(childExpr));
  } else {
    // Multiple children - build container (reuse existing logic)
    // Extract statements from buildMultipleChildren IIFE
    const multipleChildrenIIFE = buildMultipleChildren(children, context, generateElement);

    // Extract the arrow function from the call expression
    const callExpr = multipleChildrenIIFE as ts.CallExpression;
    const parenExpr = callExpr.expression as ts.ParenthesizedExpression;
    const arrowFunc = parenExpr.expression as ts.ArrowFunction;
    const block = arrowFunc.body as ts.Block;

    // Use those statements directly
    statements.push(...block.statements);
  }

  // Wrap in arrow function (NOT IIFE - deferred execution)
  return context.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    context.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    context.factory.createBlock(statements, true)
  );
};
