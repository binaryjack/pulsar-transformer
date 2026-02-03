/**
 * Event Transform Strategy Constructor
 */

import type { IEventTransformStrategyInternal, IEventTransformConfig } from './event-transform-strategy.types';

export const EventTransformStrategy = function (
  this: IEventTransformStrategyInternal,
  config: IEventTransformConfig = {}
) {
  Object.defineProperty(this, 'name', {
    value: 'EventTransformStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'handles', {
    value: ['EventHandlerIR'],
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, '_config', {
    value: {
      useCapture: config.useCapture ?? false,
      passive: config.passive ?? false,
    },
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: IEventTransformConfig): IEventTransformStrategyInternal };
