import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { IComponentCallContext } from '../component-call-generator.types.js';

/**
 * Builds expression for a single child
 * Handles: text, expression, or element
 */
export const buildSingleChild = function (
  child: IJSXElementIR['children'][0],
  context: IComponentCallContext,
  generateElement: (ir: IJSXElementIR, context: IComponentCallContext) => ts.Expression
): ts.Expression {
  if (child.type === 'text') {
    return context.factory.createStringLiteral(child.content);
  }

  if (child.type === 'expression') {
    // Visit expression to transform nested JSX
    return context.jsxVisitor
      ? (ts.visitNode(child.expression, context.jsxVisitor) as ts.Expression)
      : child.expression;
  }

  // Element type - recursively generate
  return generateElement(child as IJSXElementIR, context);
};
