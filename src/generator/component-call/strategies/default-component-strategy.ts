import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { buildMultipleChildren } from '../children-builders/build-multiple-children.js';
import { buildSingleChild } from '../children-builders/build-single-child.js';
import {
  IComponentCallContext,
  IComponentCallStrategy,
} from '../component-call-generator.types.js';
import { buildPropsObject } from '../props-builders/build-props-object.js';

/**
 * Default Component Strategy
 * Handles all other cases (no children, or multiple children without provider)
 */
export const DefaultComponentStrategy = function (this: IDefaultComponentStrategyInternal) {
  // No internal state needed
} as unknown as { new (): IDefaultComponentStrategyInternal };

interface IDefaultComponentStrategyInternal extends IComponentCallStrategy {}

/**
 * This is the fallback strategy - always returns true
 */
DefaultComponentStrategy.prototype.canHandle = function (
  this: IDefaultComponentStrategyInternal,
  context: IComponentCallContext
): boolean {
  // Always can handle as fallback
  return true;
};

/**
 * Generate component call for default cases
 */
DefaultComponentStrategy.prototype.generateCall = function (
  this: IDefaultComponentStrategyInternal,
  context: IComponentCallContext,
  generateElement: (ir: IJSXElementIR, context: IComponentCallContext) => ts.Expression
): ts.Expression {
  const props = buildPropsObject(context.componentIR.props, context);

  // Handle children if present
  if (context.componentIR.children.length > 0) {
    const childrenExpr =
      context.componentIR.children.length === 1
        ? buildSingleChild(context.componentIR.children[0], context, generateElement)
        : buildMultipleChildren(context.componentIR.children, context, generateElement);

    props.push(
      context.factory.createPropertyAssignment(
        context.factory.createIdentifier('children'),
        childrenExpr
      )
    );
  }

  // Generate: Component({ ...props })
  return context.factory.createCallExpression(
    context.componentIR.component as ts.Expression,
    undefined,
    [context.factory.createObjectLiteralExpression(props, props.length > 1)]
  );
};
