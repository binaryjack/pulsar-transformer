/**
 * enter-component.ts
 * Add component to call stack
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type { IRecursionDetectorInternal } from '../recursion-detector.types.js';

/**
 * Enter a component scope
 * Adds component name to the call stack
 */
export function enterComponent(this: IRecursionDetectorInternal, componentName: string): void {
  this._callStack.push(componentName);
}
