/**
 * Component Detector - Orchestrator
 *
 * Runs multiple detection strategies and aggregates results.
 * Uses strategy pattern per architectural decision D1.
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see docs/architecture/transformation-issues/03-DECISIONS.md - D1
 * @see .github/00-CRITICAL-RULES.md - Prototype patterns
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import type * as ts from 'typescript';
import type {
  IComponentDetectorInternal,
  IDetectionStrategy,
  IDetectionContext,
  IAggregatedDetectionResult,
  IDetectionResult,
  DetectionConfidence,
} from './component-detector.types.js';

/**
 * ComponentDetector constructor
 *
 * Orchestrates multiple detection strategies.
 */
export const ComponentDetector = function (
  this: IComponentDetectorInternal,
  context: IDetectionContext
) {
  Object.defineProperty(this, '_strategies', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_context', {
    value: context,
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (context: IDetectionContext): IComponentDetectorInternal };

/**
 * Register a detection strategy
 */
ComponentDetector.prototype.registerStrategy = function (
  this: IComponentDetectorInternal,
  strategy: IDetectionStrategy
): void {
  this._strategies.push(strategy);

  // Sort by priority (lower number = higher priority)
  this._strategies.sort((a: IDetectionStrategy, b: IDetectionStrategy) => a.priority - b.priority);
};

/**
 * Get component name from node
 */
ComponentDetector.prototype.getComponentName = function (
  this: IComponentDetectorInternal,
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): string | undefined {
  return node.name?.getText(this._context.sourceFile);
};

/**
 * Run all strategies on node
 */
ComponentDetector.prototype.runStrategies = function (
  this: IComponentDetectorInternal,
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): IDetectionResult[] {
  return this._strategies.map((strategy: IDetectionStrategy) =>
    strategy.detect(node, this._context)
  );
};

/**
 * Detect if node is a component
 *
 * Runs all strategies and aggregates results.
 * Priority order determines final decision.
 */
ComponentDetector.prototype.detect = function (
  this: IComponentDetectorInternal,
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): IAggregatedDetectionResult {
  const strategyResults = this.runStrategies(node);

  // Find first positive detection (strategies are sorted by priority)
  const primaryDetection = strategyResults.find((result: IDetectionResult) => result.isComponent);

  if (primaryDetection) {
    return {
      isComponent: true,
      confidence: primaryDetection.confidence,
      strategyResults,
      primaryReason: primaryDetection,
      componentName: primaryDetection.componentName || this.getComponentName(node),
    };
  }

  // No positive detection - not a component
  // Use lowest confidence from all negative results
  const lowestConfidence: DetectionConfidence = 'low';

  return {
    isComponent: false,
    confidence: lowestConfidence,
    strategyResults,
    componentName: this.getComponentName(node),
  };
};
