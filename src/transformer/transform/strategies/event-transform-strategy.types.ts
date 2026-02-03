/**
 * Event Transform Strategy Type Definitions
 * 
 * Strategy 4: Event-to-Listener transformation
 * Converts EventHandlerIR → DOM addEventListener
 */

import type ts from 'typescript';
import type { IEventHandlerIR } from '../../../analyzer/ir/ir-node-types';
import type { ITransformContext, IEventTransformStrategy } from '../transform-strategy.types';

export interface IEventTransformStrategyInternal extends IEventTransformStrategy {
  _createListenerCall(handler: IEventHandlerIR, context: ITransformContext): ts.CallExpression;
}

export interface IEventTransformConfig {
  useCapture?: boolean;
  passive?: boolean;
}
