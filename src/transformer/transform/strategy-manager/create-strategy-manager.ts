/**
 * Create Transform Strategy Manager Factory
 */

import { TransformStrategyManager } from './strategy-manager';
import type { ITransformStrategyManager, ITransformStrategyConfig } from '../transform-strategy.types';
import './strategy-manager.prototype';

export function createTransformStrategyManager(
  config?: ITransformStrategyConfig
): ITransformStrategyManager {
  return new TransformStrategyManager(config) as unknown as ITransformStrategyManager;
}
