/**
 * Component Transform Strategy Constructor
 * 
 * Transforms ComponentIR → Registry-registered TypeScript function
 * 
 * Input:  ComponentIR (name, parameters, body, reactiveDependencies)
 * Output: Registry-registered function declaration
 * 
 * Example:
 * ComponentIR { name: 'Counter', parameters: [...], body: [...] }
 * →
 * function Counter() { ... }
 * registry.register('component:Counter', () => Counter);
 */

import type ts from 'typescript';
import type { IComponentTransformStrategyInternal, IComponentTransformConfig } from './component-transform-strategy.types';
import type { IComponentIR, IRNode } from '../../../analyzer/ir/ir-node-types';
import type { ITransformContext } from '../transform-strategy.types';

/**
 * Component transformation strategy constructor
 */
export const ComponentTransformStrategy = function (
  this: IComponentTransformStrategyInternal,
  config: IComponentTransformConfig = {}
) {
  // Strategy metadata
  Object.defineProperty(this, 'name', {
    value: 'ComponentTransformStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'handles', {
    value: ['ComponentIR'],
    writable: false,
    enumerable: true,
    configurable: false,
  });

  // Config
  Object.defineProperty(this, '_config', {
    value: {
      generateDocs: config.generateDocs ?? true,
      inlineStaticChildren: config.inlineStaticChildren ?? true,
      optimizePureComponents: config.optimizePureComponents ?? true,
    },
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: IComponentTransformConfig): IComponentTransformStrategyInternal };
