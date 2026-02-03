/**
 * Transform Strategy Manager Constructor
 * 
 * Manages registration and selection of transformation strategies
 */

import type { ITransformStrategyManagerInternal } from './strategy-manager.types';
import type { ITransformStrategyConfig } from '../transform-strategy.types';

export const TransformStrategyManager = function (
  this: ITransformStrategyManagerInternal,
  config: ITransformStrategyConfig = {}
) {
  Object.defineProperty(this, '_strategies', {
    value: new Map(),
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_config', {
    value: {
      enableStaticOptimizations: config.enableStaticOptimizations ?? true,
      enableSignalMemoization: config.enableSignalMemoization ?? true,
      enableRegistryCaching: config.enableRegistryCaching ?? true,
      collectErrors: config.collectErrors ?? true,
      maxErrors: config.maxErrors ?? 100,
    },
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: ITransformStrategyConfig): ITransformStrategyManagerInternal };
