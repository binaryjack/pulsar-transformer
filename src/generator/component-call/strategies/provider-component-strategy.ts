import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { componentUsesProvider } from '../../utils/provider-detector.js';
import { buildDeferredChildren } from '../children-builders/build-deferred-children.js';
import {
  IComponentCallContext,
  IComponentCallStrategy,
} from '../component-call-generator.types.js';
import { buildPropsObject } from '../props-builders/build-props-object.js';

/**
 * Provider Component Strategy
 * Handles components WITH providers - children must be deferred (arrow function)
 */
export const ProviderComponentStrategy = function (this: IProviderComponentStrategyInternal) {
  // No internal state needed
} as unknown as { new (): IProviderComponentStrategyInternal };

interface IProviderComponentStrategyInternal extends IComponentCallStrategy {}

/**
 * Check if this strategy can handle the component
 */
ProviderComponentStrategy.prototype.canHandle = function (
  this: IProviderComponentStrategyInternal,
  context: IComponentCallContext
): boolean {
  const typeChecker = context.typeChecker!;
  const sourceFile = context.sourceFile!;
  return componentUsesProvider(
    context.componentIR.component as ts.Expression,
    typeChecker,
    sourceFile
  );
};

/**
 * Generate component call with deferred children
 */
ProviderComponentStrategy.prototype.generateCall = function (
  this: IProviderComponentStrategyInternal,
  context: IComponentCallContext,
  generateElement: (ir: IJSXElementIR, context: IComponentCallContext) => ts.Expression
): ts.Expression {
  const props = buildPropsObject(context.componentIR.props, context);

  // Build deferred children (wrapped in arrow function)
  const childrenExpr = buildDeferredChildren(
    context.componentIR.children,
    context,
    generateElement
  );

  // Add deferred children to props
  props.push(
    context.factory.createPropertyAssignment(
      context.factory.createIdentifier('children'),
      childrenExpr
    )
  );

  // Generate: Provider({ ...props, children: () => ... })
  return context.factory.createCallExpression(
    context.componentIR.component as ts.Expression,
    undefined,
    [context.factory.createObjectLiteralExpression(props, props.length > 1)]
  );
};
