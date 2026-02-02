/**
 * Create Component Detector - Factory Function
 *
 * Creates a ComponentDetector with all detection strategies registered.
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Factory pattern
 */

import * as ts from 'typescript';

import { ComponentDetector } from './component-detector.js';
import { ConditionalJsxReturnStrategy } from './strategies/conditional-jsx-return-strategy.js';
import { DirectJsxReturnStrategy } from './strategies/direct-jsx-return-strategy.js';
import { HasJsxInBodyStrategy } from './strategies/has-jsx-in-body-strategy.js';
import { PascalCaseStrategy } from './strategies/pascal-case-strategy.js';
import { ReturnTypeStrategy } from './strategies/return-type-strategy.js';
import { VariableJsxReturnStrategy } from './strategies/variable-jsx-return-strategy.js';

import type {
  IComponentDetector,
  IComponentDetectorConfig,
  IDetectionContext,
} from './component-detector.types.js';

/**
 * Create a new ComponentDetector with all strategies registered
 *
 * Registers strategies in priority order:
 * 1. ReturnTypeStrategy (P1) - Explicit type annotation
 * 2. DirectJsxReturnStrategy (P2) - Direct JSX return
 * 2. VariableJsxReturnStrategy (P2) - THE BIG FIX
 * 2. ConditionalJsxReturnStrategy (P2) - Conditional JSX
 * 3. PascalCaseStrategy (P3) - Naming convention
 * 6. HasJsxInBodyStrategy (P6) - Fallback
 *
 * @param config - Configuration for detector
 * @returns ComponentDetector instance
 *
 * @example
 * ```typescript
 * import { createComponentDetector } from './create-component-detector';
 *
 * const detector = createComponentDetector({
 *   checker: program.getTypeChecker(),
 *   sourceFile: sourceFile,
 *   debug: true
 * });
 *
 * const result = detector.detect(functionNode);
 * if (result.isComponent) {
 *   console.log(`Detected component: ${result.componentName}`);
 *   console.log(`Strategy: ${result.primaryReason?.strategy}`);
 * }
 * ```
 */
export function createComponentDetector(config: IComponentDetectorConfig = {}): IComponentDetector {
  // Create dummy context if not provided (for testing)
  const context: IDetectionContext = {
    checker: config.checker || ({} as ts.TypeChecker),
    sourceFile: config.sourceFile || ({} as ts.SourceFile),
    debug: config.debug,
  };

  const detector = new ComponentDetector(context) as unknown as IComponentDetector;

  // Register default strategies (or custom if provided)
  const strategies = config.strategies || [
    new ReturnTypeStrategy(),
    new DirectJsxReturnStrategy(),
    new VariableJsxReturnStrategy(), // ⭐ THE BIG FIX
    new ConditionalJsxReturnStrategy(),
    new PascalCaseStrategy(),
    new HasJsxInBodyStrategy(),
  ];

  strategies.forEach((strategy) => detector.registerStrategy(strategy));

  return detector;
}
