/**
 * Signal Transform Strategy Constructor
 */

import type {
  ISignalTransformConfig,
  ISignalTransformStrategyInternal,
} from './signal-transform-strategy.types.js';

export const SignalTransformStrategy = function (
  this: ISignalTransformStrategyInternal,
  config: ISignalTransformConfig = {}
) {
  Object.defineProperty(this, 'name', {
    value: 'SignalTransformStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'handles', {
    value: ['SignalBindingIR'],
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, '_config', {
    value: {
      memoizeReads: config.memoizeReads ?? true,
      batchUpdates: config.batchUpdates ?? true,
    },
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: ISignalTransformConfig): ISignalTransformStrategyInternal };
