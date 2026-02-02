/**
 * Component Detector - Type Definitions
 *
 * Strategy pattern for detecting Pulsar components in TypeScript AST.
 * Implements 6 detection strategies to fix infinite loop bugs.
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/00-CRITICAL-RULES.md - Prototype patterns
 * @module component-detector.types
 */

import type * as ts from 'typescript';

/**
 * Detection confidence level
 */
export type DetectionConfidence = 'high' | 'medium' | 'low';

/**
 * Result from a component detection check
 */
export interface IDetectionResult {
  /** Whether component was detected */
  isComponent: boolean;
  /** Confidence level of detection */
  confidence: DetectionConfidence;
  /** Name of strategy that made detection */
  strategy: string;
  /** Reason for detection result */
  reason: string;
  /** Component name if detected */
  componentName?: string;
}

/**
 * Context for detection strategies
 */
export interface IDetectionContext {
  /** TypeScript type checker */
  checker: ts.TypeChecker;
  /** Source file being analyzed */
  sourceFile: ts.SourceFile;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Base interface for all detection strategies
 */
export interface IDetectionStrategy {
  /** Name of the strategy */
  readonly name: string;
  /** Priority (lower = higher priority) */
  readonly priority: number;

  /**
   * Check if node is a component
   * @param node - Function/arrow function to check
   * @param context - Detection context
   * @returns Detection result
   */
  detect(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
    context: IDetectionContext
  ): IDetectionResult;
}

/**
 * S1: PascalCase naming convention strategy
 */
export interface IPascalCaseStrategy extends IDetectionStrategy {
  /** Check if name is PascalCase */
  isPascalCase(name: string): boolean;
}

/**
 * S2: Return type annotation strategy
 */
export interface IReturnTypeStrategy extends IDetectionStrategy {
  /** Check if has HTMLElement return type */
  hasHtmlElementReturnType(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): boolean;
}

/**
 * S3: Direct JSX return strategy
 */
export interface IDirectJsxReturnStrategy extends IDetectionStrategy {
  /** Check if directly returns JSX */
  hasDirectJsxReturn(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): boolean;
}

/**
 * S4: Variable JSX return strategy (THE BIG FIX)
 *
 * Detects pattern: const el = <JSX>; return el;
 * This is the root cause of infinite loops.
 */
export interface IVariableJsxReturnStrategy extends IDetectionStrategy {
  /** Check if assigns JSX to variable then returns it */
  hasVariableJsxReturn(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): boolean;
  /** Extract variable name from JSX assignment */
  getJsxVariableName(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): string | undefined;
}

/**
 * S5: Conditional JSX return strategy
 */
export interface IConditionalJsxReturnStrategy extends IDetectionStrategy {
  /** Check if conditionally returns JSX */
  hasConditionalJsxReturn(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): boolean;
}

/**
 * S6: Has JSX in body strategy
 */
export interface IHasJsxInBodyStrategy extends IDetectionStrategy {
  /** Check if has any JSX in function body */
  hasJsxInBody(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): boolean;
  /** Count JSX elements in body */
  countJsxElements(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): number;
}

/**
 * Aggregated detection result from all strategies
 */
export interface IAggregatedDetectionResult {
  /** Overall detection result */
  isComponent: boolean;
  /** Overall confidence */
  confidence: DetectionConfidence;
  /** Results from all strategies */
  strategyResults: IDetectionResult[];
  /** Highest priority positive detection */
  primaryReason?: IDetectionResult;
  /** Component name */
  componentName?: string;
}

/**
 * Internal interface for ComponentDetector implementation
 */
export interface IComponentDetectorInternal {
  /** Registered strategies */
  _strategies: IDetectionStrategy[];
  /** Detection context */
  _context: IDetectionContext;

  /** Register a detection strategy */
  registerStrategy(strategy: IDetectionStrategy): void;
  /** Detect if node is a component */
  detect(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): IAggregatedDetectionResult;
  /** Get component name from node */
  getComponentName(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): string | undefined;
  /** Run all strategies on node */
  runStrategies(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): IDetectionResult[];
}

/**
 * Public interface for ComponentDetector
 */
export interface IComponentDetector {
  /** Register a detection strategy */
  registerStrategy(strategy: IDetectionStrategy): void;
  /** Detect if node is a component */
  detect(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): IAggregatedDetectionResult;
  /** Get component name from node */
  getComponentName(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
  ): string | undefined;
}

/**
 * Configuration for ComponentDetector
 */
export interface IComponentDetectorConfig {
  /** TypeScript type checker */
  checker: ts.TypeChecker;
  /** Source file being analyzed */
  sourceFile: ts.SourceFile;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom strategies to register */
  strategies?: IDetectionStrategy[];
}
