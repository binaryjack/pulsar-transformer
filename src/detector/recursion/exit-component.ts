/**
 * exit-component.ts
 * Remove component from call stack
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type { IRecursionDetectorInternal } from '../recursion-detector.types.js';

/**
 * Exit a component scope
 * Removes component name from the call stack
 */
export function exitComponent(this: IRecursionDetectorInternal, componentName: string): void {
  // Remove last occurrence of component name
  const index = this._callStack.lastIndexOf(componentName);

  if (index !== -1) {
    this._callStack.splice(index, 1);
  }
}
