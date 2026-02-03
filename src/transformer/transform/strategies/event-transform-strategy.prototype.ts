/**
 * Event Transform Strategy Prototype Methods
 */

import ts from 'typescript';
import type { IEventHandlerIR, IIRNode } from '../../../analyzer/ir/ir-node-types.js';
import type { ITransformContext } from '../transform-strategy.types.js';
import { EventTransformStrategy } from './event-transform-strategy.js';
import type { IEventTransformStrategyInternal } from './event-transform-strategy.types.js';

export function canTransform(
  this: IEventTransformStrategyInternal,
  node: IIRNode
): node is IEventHandlerIR {
  return node.type === 'EventHandlerIR';
}

export function transform(
  this: IEventTransformStrategyInternal,
  node: IEventHandlerIR,
  context: ITransformContext
): ts.Statement {
  return this.transformToListener(node, context);
}

export function getImports(
  this: IEventTransformStrategyInternal,
  node: IEventHandlerIR
): Map<string, Set<string>> {
  return new Map(); // No imports needed for native addEventListener
}

export function transformToListener(
  this: IEventTransformStrategyInternal,
  handler: IEventHandlerIR,
  context: ITransformContext
): ts.Statement {
  const eventName = this.normalizeEventName(handler.eventName);
  const listenerFn = this.generateListenerFunction(handler, context);

  // element.addEventListener('click', (e) => { ... })
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('element'),
        ts.factory.createIdentifier('addEventListener')
      ),
      undefined,
      [ts.factory.createStringLiteral(eventName), listenerFn]
    )
  );
}

export function generateListenerFunction(
  this: IEventTransformStrategyInternal,
  handler: IEventHandlerIR,
  context: ITransformContext
): ts.ArrowFunction {
  // (e) => { handler.expression }
  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier('e'),
        undefined,
        undefined,
        undefined
      ),
    ],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.factory.createBlock(
      [
        ts.factory.createExpressionStatement(
          ts.factory.createIdentifier('handler') // Placeholder
        ),
      ],
      true
    )
  );
}

export function normalizeEventName(
  this: IEventTransformStrategyInternal,
  eventName: string
): string {
  // onClick → click, onMouseMove → mousemove
  if (eventName.startsWith('on')) {
    return eventName.slice(2).toLowerCase();
  }
  return eventName.toLowerCase();
}

// Attach methods
EventTransformStrategy.prototype.canTransform = canTransform;
EventTransformStrategy.prototype.transform = transform;
EventTransformStrategy.prototype.getImports = getImports;
EventTransformStrategy.prototype.transformToListener = transformToListener;
EventTransformStrategy.prototype.generateListenerFunction = generateListenerFunction;
EventTransformStrategy.prototype.normalizeEventName = normalizeEventName;

Object.defineProperties(EventTransformStrategy.prototype, {
  canTransform: { enumerable: false },
  transform: { enumerable: false },
  getImports: { enumerable: false },
  transformToListener: { enumerable: false },
  generateListenerFunction: { enumerable: false },
  normalizeEventName: { enumerable: false },
});
