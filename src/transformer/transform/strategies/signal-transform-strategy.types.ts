/**
 * Signal Transform Strategy Type Definitions
 *
 * Strategy 3: Signal-to-Reactive transformation
 * Converts SignalBindingIR → Reactive subscription code
 */

import type ts from 'typescript';
import type { ISignalBindingIR } from '../../../analyzer/ir/ir-node-types.js';
import type { ISignalTransformStrategy, ITransformContext } from '../transform-strategy.types.js';

export interface ISignalTransformStrategyInternal extends ISignalTransformStrategy {
  _generateSubscription(binding: ISignalBindingIR, context: ITransformContext): ts.CallExpression;
  _generateUpdateExpression(binding: ISignalBindingIR, context: ITransformContext): ts.Expression;
}

export interface ISignalTransformConfig {
  memoizeReads?: boolean;
  batchUpdates?: boolean;
}
