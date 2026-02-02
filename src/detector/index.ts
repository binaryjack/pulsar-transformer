/**
 * Detector - Public API
 *
 * Exports ComponentDetector and RecursionDetector.
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see docs/architecture/transformation-issues/agents/recursion-detector-agent.md
 * @see .github/00-CRITICAL-RULES.md - Export patterns
 */

// ComponentDetector - Public factory function
export { createComponentDetector } from './create-component-detector.js';

// ComponentDetector - Public types
export type {
  DetectionConfidence,
  IAggregatedDetectionResult,
  IComponentDetector,
  IComponentDetectorConfig,
  IConditionalJsxReturnStrategy,
  IDetectionContext,
  IDetectionResult,
  IDetectionStrategy,
  IDirectJsxReturnStrategy,
  IHasJsxInBodyStrategy,
  // Strategy interfaces (for custom strategies)
  IPascalCaseStrategy,
  IReturnTypeStrategy,
  IVariableJsxReturnStrategy,
} from './component-detector.types.js';

// ComponentDetector - Export individual strategies (for custom detector configurations)
export { ConditionalJsxReturnStrategy } from './strategies/conditional-jsx-return-strategy.js';
export { DirectJsxReturnStrategy } from './strategies/direct-jsx-return-strategy.js';
export { HasJsxInBodyStrategy } from './strategies/has-jsx-in-body-strategy.js';
export { PascalCaseStrategy } from './strategies/pascal-case-strategy.js';
export { ReturnTypeStrategy } from './strategies/return-type-strategy.js';
export { VariableJsxReturnStrategy } from './strategies/variable-jsx-return-strategy.js';

// RecursionDetector - Public factory function
export { createRecursionDetector } from './create-recursion-detector.js';

// RecursionDetector - Public types
export type { IRecursionCheckResult, IRecursionDetector } from './recursion-detector.types.js';
