import * as ts from 'typescript';
import { IJSXElementIR } from '../../ir/types/index.js';
import { IComponentCallContext, IComponentCallStrategy } from './component-call-generator.types.js';
import { DefaultComponentStrategy } from './strategies/default-component-strategy.js';
import { ProviderComponentStrategy } from './strategies/provider-component-strategy.js';
import { SimpleComponentStrategy } from './strategies/simple-component-strategy.js';

/**
 * Component Call Generator
 * Orchestrates component call generation using strategies
 */
export const ComponentCallGenerator = function (this: IComponentCallGeneratorInternal) {
  // Initialize strategies (order matters - first match wins)
  Object.defineProperty(this, 'strategies', {
    value: [
      new SimpleComponentStrategy(), // Single child, no provider
      new ProviderComponentStrategy(), // Provider components
      new DefaultComponentStrategy(), // Fallback for all other cases
    ],
    writable: false,
    enumerable: false,
  });

  Object.defineProperty(this, 'varCounter', {
    value: 0,
    writable: true,
    enumerable: false,
  });
} as unknown as { new (): IComponentCallGeneratorInternal };

/**
 * Internal interface
 */
interface IComponentCallGeneratorInternal {
  strategies: IComponentCallStrategy[];
  varCounter: number;
  generateCall(
    componentIR: IJSXElementIR,
    factory: ts.NodeFactory,
    jsxVisitor?: ts.Visitor,
    typeChecker?: ts.TypeChecker,
    sourceFile?: ts.SourceFile
  ): ts.Expression;
}

/**
 * Generate component call using appropriate strategy
 */
ComponentCallGenerator.prototype.generateCall = function (
  this: IComponentCallGeneratorInternal,
  componentIR: IJSXElementIR,
  factory: ts.NodeFactory,
  jsxVisitor?: ts.Visitor,
  typeChecker?: ts.TypeChecker,
  sourceFile?: ts.SourceFile
): ts.Expression {
  const context: IComponentCallContext = {
    componentIR,
    factory,
    jsxVisitor,
    varCounter: this.varCounter,
    typeChecker,
    sourceFile,
  };

  // Find matching strategy (first one that can handle)
  const strategy = this.strategies.find((s) => s.canHandle(context));

  if (!strategy) {
    throw new Error('[ComponentCallGenerator] No strategy found - should never happen!');
  }

  // Generate element recursively
  const generateElement = (ir: IJSXElementIR, ctx: IComponentCallContext): ts.Expression => {
    const newContext = { ...ctx, componentIR: ir, varCounter: this.varCounter };
    const innerStrategy = this.strategies.find((s) => s.canHandle(newContext));
    if (!innerStrategy) {
      throw new Error('[ComponentCallGenerator] No strategy for nested element');
    }
    const result = innerStrategy.generateCall(newContext, generateElement);
    this.varCounter = newContext.varCounter; // Update counter
    return result;
  };

  const result = strategy.generateCall(context, generateElement);

  // Update counter for next call
  this.varCounter = context.varCounter;

  return result;
};
