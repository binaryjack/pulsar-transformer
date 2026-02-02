/**
 * recursion-detector.ts
 * Detects self-recursion in components to prevent infinite loops
 *
 * @see docs/architecture/transformation-issues/agents/recursion-detector-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import type { IRecursionDetectorInternal } from './recursion-detector.types.js';

/**
 * RecursionDetector constructor
 * Uses prototype pattern (NO class keyword)
 */
export const RecursionDetector = function (this: IRecursionDetectorInternal) {
  // Initialize private call stack
  Object.defineProperty(this, '_callStack', {
    value: [] as string[],
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (): IRecursionDetectorInternal };
