/**
 * create-recursion-detector.ts
 * Factory function for creating RecursionDetector instances
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Factory pattern
 */

import './recursion/index.js'; // Ensure prototype methods are attached

import { RecursionDetector } from './recursion-detector.js';

import type { IRecursionDetector } from './recursion-detector.types.js';
/**
 * Create a new RecursionDetector instance
 *
 * @returns New recursion detector instance
 */
export function createRecursionDetector(): IRecursionDetector {
  return new RecursionDetector() as unknown as IRecursionDetector;
}
