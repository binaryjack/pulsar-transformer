import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { buildMultipleChildren } from '../children-builders/build-multiple-children.js';
import { buildSingleChild } from '../children-builders/build-single-child.js';
import {
  IComponentCallContext,
  IComponentCallStrategy,
} from '../component-call-generator.types.js';
import { generateMemoWrapper } from '../memo/generate-memo-wrapper.js';
import { getMemoPragmaOptions } from '../memo/memo-utils.js';
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

  const propsObject = context.factory.createObjectLiteralExpression(props, props.length > 1);
  const componentExpr = context.componentIR.component as ts.Expression;

  // Memoization is now handled by generateMemoWrapper (currently returns direct call)
  // Check for memoization pragma
  const memoOptions =
    context.sourceFile && ts.isIdentifier(componentExpr)
      ? getMemoPragmaOptions(componentExpr)
      : { enabled: true }; // Re-enabled for production use

  // If memoization disabled, generate direct call
  if (!memoOptions.enabled) {
    return context.factory.createCallExpression(componentExpr, undefined, [propsObject]);
  }

  // Generate memoized call (currently just returns direct call)
  const componentName = ts.isIdentifier(componentExpr) ? componentExpr.text : 'Component';

  return generateMemoWrapper({
    componentName,
    componentExpr,
    propsExpr: propsObject,
    varCounter: context.varCounter++,
    factory: context.factory,
  });
};
