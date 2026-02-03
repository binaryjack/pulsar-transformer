/**
 * Component Transform Strategy Factory
 * 
 * Creates instances of ComponentTransformStrategy
 */

import { ComponentTransformStrategy } from './component-transform-strategy';
import type { IComponentTransformStrategy } from '../transform-strategy.types';
import type { IComponentTransformConfig } from './component-transform-strategy.types';
import './component-transform-strategy.prototype';

/**
 * Create component transformation strategy
 */
export function createComponentTransformStrategy(
  config?: IComponentTransformConfig
): IComponentTransformStrategy {
  return new ComponentTransformStrategy(config) as unknown as IComponentTransformStrategy;
}
