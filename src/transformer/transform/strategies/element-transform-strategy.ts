/**
 * Element Transform Strategy Constructor
 *
 * Transforms ElementIR → DOM creation code
 */

import type {
  IElementTransformConfig,
  IElementTransformStrategyInternal,
} from './element-transform-strategy.types.js';

export const ElementTransformStrategy = function (
  this: IElementTransformStrategyInternal,
  config: IElementTransformConfig = {}
) {
  Object.defineProperty(this, 'name', {
    value: 'ElementTransformStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'handles', {
    value: ['ElementIR'],
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, '_config', {
    value: {
      useNativeDOM: config.useNativeDOM ?? true,
      optimizeStatic: config.optimizeStatic ?? true,
    },
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: IElementTransformConfig): IElementTransformStrategyInternal };
