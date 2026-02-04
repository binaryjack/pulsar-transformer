/**
 * Component Transform Strategy Factory
 *
 * Creates instances of ComponentTransformStrategy
 */

import type { IComponentTransformStrategy } from '../transform-strategy.types.js';
import { ComponentTransformStrategy } from './component-transform-strategy.js';
import './component-transform-strategy.prototype.js';
import type { IComponentTransformConfig } from './component-transform-strategy.types.js';

/**
 * Create component transformation strategy
 */
export function createComponentTransformStrategy(
  config?: IComponentTransformConfig
): IComponentTransformStrategy {
  return new ComponentTransformStrategy(config) as unknown as IComponentTransformStrategy;
}
