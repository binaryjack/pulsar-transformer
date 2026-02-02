/**
 * recursion-detector.types.ts
 * Type definitions for recursion detection
 *
 * @see docs/architecture/transformation-issues/agents/recursion-detector-agent.md
 * @see .github/00-CRITICAL-RULES.md - One item per file rule
 */

/**
 * Recursion detector interface
 */
export interface IRecursionDetector {
  /** Enter a component scope (add to call stack) */
  enterComponent(componentName: string): void;

  /** Exit a component scope (remove from call stack) */
  exitComponent(componentName: string): void;

  /** Check if component is already in call stack (self-recursion) */
  checkRecursion(componentName: string): boolean;

  /** Get current call stack for debugging */
  getCallStack(): readonly string[];

  /** Clear the call stack (for cleanup) */
  clear(): void;
}

/**
 * Internal recursion detector with private state
 */
export interface IRecursionDetectorInternal extends IRecursionDetector {
  /** Internal call stack */
  _callStack: string[];
}

/**
 * Recursion detection result
 */
export interface IRecursionCheckResult {
  /** Whether recursion was detected */
  hasRecursion: boolean;

  /** Component name that is recursive */
  componentName?: string;

  /** Current call stack at detection time */
  callStack: string[];

  /** Error message if recursion detected */
  errorMessage?: string;
}
