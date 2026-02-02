/**
 * clear.ts
 * Clear the call stack
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type { IRecursionDetectorInternal } from '../recursion-detector.types.js';

/**
 * Clear the entire call stack
 * Useful for cleanup between transformations
 */
export function clear(this: IRecursionDetectorInternal): void {
  this._callStack.length = 0;
}
