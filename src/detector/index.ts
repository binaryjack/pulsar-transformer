/**
 * Component Detector - Public API
 *
 * Exports public factory and types for ComponentDetector.
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/00-CRITICAL-RULES.md - Export patterns
 */

// Public factory function
export { createComponentDetector } from './create-component-detector.js';

// Public types
export type {
  DetectionConfidence,
  IDetectionResult,
  IDetectionContext,
  IDetectionStrategy,
  IAggregatedDetectionResult,
  IComponentDetector,
  IComponentDetectorConfig,

  // Strategy interfaces (for custom strategies)
  IPascalCaseStrategy,
  IReturnTypeStrategy,
  IDirectJsxReturnStrategy,
  IVariableJsxReturnStrategy,
  IConditionalJsxReturnStrategy,
  IHasJsxInBodyStrategy,
} from './component-detector.types.js';

// Export individual strategies (for custom detector configurations)
export { PascalCaseStrategy } from './strategies/pascal-case-strategy.js';
export { ReturnTypeStrategy } from './strategies/return-type-strategy.js';
export { DirectJsxReturnStrategy } from './strategies/direct-jsx-return-strategy.js';
export { VariableJsxReturnStrategy } from './strategies/variable-jsx-return-strategy.js';
export { ConditionalJsxReturnStrategy } from './strategies/conditional-jsx-return-strategy.js';
export { HasJsxInBodyStrategy } from './strategies/has-jsx-in-body-strategy.js';
