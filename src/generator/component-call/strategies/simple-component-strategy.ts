import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { componentUsesProvider } from '../../utils/provider-detector.js';
import { buildSingleChild } from '../children-builders/build-single-child.js';
import {
  IComponentCallContext,
  IComponentCallStrategy,
} from '../component-call-generator.types.js';
import { buildPropsObject } from '../props-builders/build-props-object.js';

/**
 * Simple Component Strategy
 * Handles components WITHOUT providers and WITH single child
 */
export const SimpleComponentStrategy = function (this: ISimpleComponentStrategyInternal) {
  // No internal state needed
} as unknown as { new (): ISimpleComponentStrategyInternal };

interface ISimpleComponentStrategyInternal extends IComponentCallStrategy {}

/**
 * Check if this strategy can handle the component
 */
SimpleComponentStrategy.prototype.canHandle = function (
  this: ISimpleComponentStrategyInternal,
  context: IComponentCallContext
): boolean {
  const usesProvider = componentUsesProvider(
    context.componentIR.component as ts.Expression,
    context.typeChecker!,
    context.sourceFile!
  );

  return !usesProvider && context.componentIR.children.length === 1;
};

/**
 * Generate component call for simple case
 */
SimpleComponentStrategy.prototype.generateCall = function (
  this: ISimpleComponentStrategyInternal,
  context: IComponentCallContext,
  generateElement: (ir: IJSXElementIR, context: IComponentCallContext) => ts.Expression
): ts.Expression {
  const props = buildPropsObject(context.componentIR.props, context);

  // Build single child
  const child = context.componentIR.children[0];
  const childExpr = buildSingleChild(child, context, generateElement);

  // Add children to props
  props.push(
    context.factory.createPropertyAssignment(
      context.factory.createIdentifier('children'),
      childExpr
    )
  );

  // Generate: Component({ prop1: value1, children: child })
  return context.factory.createCallExpression(
    context.componentIR.component as ts.Expression,
    undefined,
    [context.factory.createObjectLiteralExpression(props, props.length > 1)]
  );
};
