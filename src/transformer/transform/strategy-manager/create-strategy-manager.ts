/**
 * Create Transform Strategy Manager Factory
 */

import type {
  ITransformStrategyConfig,
  ITransformStrategyManager,
} from '../transform-strategy.types';
import { TransformStrategyManager } from './strategy-manager';
import './strategy-manager.prototype';

export function createTransformStrategyManager(
  config?: ITransformStrategyConfig
): ITransformStrategyManager {
  return new TransformStrategyManager(config) as unknown as ITransformStrategyManager;
}
