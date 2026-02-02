/**
 * check-recursion.ts
 * Check if component is already in call stack (self-recursion)
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type { IRecursionDetectorInternal } from '../recursion-detector.types.js';

/**
 * Check if component is already rendering (self-recursion)
 *
 * @param componentName - Name of component to check
 * @returns true if component is already in call stack (recursion detected)
 */
export function checkRecursion(this: IRecursionDetectorInternal, componentName: string): boolean {
  return this._callStack.includes(componentName);
}
