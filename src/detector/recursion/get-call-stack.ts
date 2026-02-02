/**
 * get-call-stack.ts
 * Get current call stack for debugging
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type { IRecursionDetectorInternal } from '../recursion-detector.types.js';

/**
 * Get current call stack
 * Returns a read-only copy for debugging
 */
export function getCallStack(this: IRecursionDetectorInternal): readonly string[] {
  return [...this._callStack];
}
