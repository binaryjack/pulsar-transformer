/**
 * Signal Transform Strategy Prototype Methods
 */

import ts from 'typescript';
import type { IRNode, ISignalBindingIR } from '../../../analyzer/ir/ir-node-types';
import type { ITransformContext } from '../transform-strategy.types';
import { SignalTransformStrategy } from './signal-transform-strategy';
import type { ISignalTransformStrategyInternal } from './signal-transform-strategy.types';

export function canTransform(
  this: ISignalTransformStrategyInternal,
  node: IRNode
): node is ISignalBindingIR {
  return node.type === 'SignalBindingIR';
}

export function transform(
  this: ISignalTransformStrategyInternal,
  node: ISignalBindingIR,
  context: ITransformContext
): ts.Statement[] {
  return this.transformToSubscription(node, context);
}

export function getImports(
  this: ISignalTransformStrategyInternal,
  node: ISignalBindingIR
): Map<string, Set<string>> {
  const imports = new Map<string, Set<string>>();
  imports.set('@pulsar/core', new Set(['createEffect']));
  return imports;
}

export function transformToSubscription(
  this: ISignalTransformStrategyInternal,
  binding: ISignalBindingIR,
  context: ITransformContext
): ts.Statement[] {
  const effect = this.generateEffect(binding, context);
  return [ts.factory.createExpressionStatement(effect)];
}

export function generateSignalRead(
  this: ISignalTransformStrategyInternal,
  binding: ISignalBindingIR,
  context: ITransformContext
): ts.Expression {
  // signalName()
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(binding.signalName),
    undefined,
    []
  );
}

export function generateEffect(
  this: ISignalTransformStrategyInternal,
  binding: ISignalBindingIR,
  context: ITransformContext
): ts.CallExpression {
  // createEffect(() => { element.textContent = signal(); })
  return ts.factory.createCallExpression(ts.factory.createIdentifier('createEffect'), undefined, [
    ts.factory.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      ts.factory.createBlock(
        [
          ts.factory.createExpressionStatement(
            ts.factory.createBinaryExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier('element'),
                ts.factory.createIdentifier('textContent')
              ),
              ts.factory.createToken(ts.SyntaxKind.EqualsToken),
              this.generateSignalRead(binding, context)
            )
          ),
        ],
        true
      )
    ),
  ]);
}

export function canOptimize(
  this: ISignalTransformStrategyInternal,
  binding: ISignalBindingIR
): boolean {
  return binding.canOptimize;
}

// Attach methods
SignalTransformStrategy.prototype.canTransform = canTransform;
SignalTransformStrategy.prototype.transform = transform;
SignalTransformStrategy.prototype.getImports = getImports;
SignalTransformStrategy.prototype.transformToSubscription = transformToSubscription;
SignalTransformStrategy.prototype.generateSignalRead = generateSignalRead;
SignalTransformStrategy.prototype.generateEffect = generateEffect;
SignalTransformStrategy.prototype.canOptimize = canOptimize;

Object.defineProperties(SignalTransformStrategy.prototype, {
  canTransform: { enumerable: false },
  transform: { enumerable: false },
  getImports: { enumerable: false },
  transformToSubscription: { enumerable: false },
  generateSignalRead: { enumerable: false },
  generateEffect: { enumerable: false },
  canOptimize: { enumerable: false },
});
