/**
 * Transform Strategy Manager Type Definitions
 */

import type {
  ITransformStrategy,
  ITransformStrategyConfig,
  ITransformStrategyManager,
} from '../transform-strategy.types.js';

export interface ITransformStrategyManagerInternal extends ITransformStrategyManager {
  _strategies: Map<string, ITransformStrategy>;
  _config: Required<ITransformStrategyConfig>;
}
