/**
 * Transform Strategy Manager Prototype Methods
 */

import type { ITransformStrategyManagerInternal } from './strategy-manager.types';
import type { ITransformStrategy } from '../transform-strategy.types';
import type { IRNode } from '../../../analyzer/ir/ir-node-types';
import { TransformStrategyManager } from './strategy-manager';

export function registerStrategy(
  this: ITransformStrategyManagerInternal,
  strategy: ITransformStrategy
): void {
  for (const type of strategy.handles) {
    this._strategies.set(type, strategy);
  }
}

export function getStrategy(
  this: ITransformStrategyManagerInternal,
  node: IRNode
): ITransformStrategy | undefined {
  return this._strategies.get(node.type);
}

export function getAllStrategies(this: ITransformStrategyManagerInternal): ITransformStrategy[] {
  return Array.from(new Set(this._strategies.values()));
}

export function getStrategiesByType(
  this: ITransformStrategyManagerInternal,
  type: string
): ITransformStrategy[] {
  const strategy = this._strategies.get(type);
  return strategy ? [strategy] : [];
}

// Attach methods
TransformStrategyManager.prototype.registerStrategy = registerStrategy;
TransformStrategyManager.prototype.getStrategy = getStrategy;
TransformStrategyManager.prototype.getAllStrategies = getAllStrategies;
TransformStrategyManager.prototype.getStrategiesByType = getStrategiesByType;

Object.defineProperties(TransformStrategyManager.prototype, {
  registerStrategy: { enumerable: false },
  getStrategy: { enumerable: false },
  getAllStrategies: { enumerable: false },
  getStrategiesByType: { enumerable: false },
});
