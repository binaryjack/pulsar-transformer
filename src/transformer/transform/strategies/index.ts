/**
 * Transform Strategy Exports
 *
 * Central export point for all 6 transformation strategies
 */

// Strategy 1: Component-to-Function
export type { IComponentTransformConfig } from './component-transform-strategy.types';
export { createComponentTransformStrategy } from './create-component-transform-strategy';

// Strategy 2: Element-to-DOM
export { ElementTransformStrategy } from './element-transform-strategy';
export type { IElementTransformConfig } from './element-transform-strategy.types';

// Strategy 3: Signal-to-Reactive
export { SignalTransformStrategy } from './signal-transform-strategy';
export type { ISignalTransformConfig } from './signal-transform-strategy.types';

// Strategy 4: Event-to-Listener
export { EventTransformStrategy } from './event-transform-strategy';
export type { IEventTransformConfig } from './event-transform-strategy.types';

// All strategy types
export type {
  IComponentTransformStrategy,
  IElementTransformStrategy,
  IEventTransformStrategy,
  ISignalTransformStrategy,
  ITransformStrategy,
} from '../transform-strategy.types';
