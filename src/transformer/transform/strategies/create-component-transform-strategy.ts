/**
 * Component Transform Strategy Factory
 *
 * Creates instances of ComponentTransformStrategy
 */

import type { IComponentTransformStrategy } from '../transform-strategy.types';
import { ComponentTransformStrategy } from './component-transform-strategy';
import './component-transform-strategy.prototype';
import type { IComponentTransformConfig } from './component-transform-strategy.types';

/**
 * Create component transformation strategy
 */
export function createComponentTransformStrategy(
  config?: IComponentTransformConfig
): IComponentTransformStrategy {
  return new ComponentTransformStrategy(config) as unknown as IComponentTransformStrategy;
}
