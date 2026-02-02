/**
 * index.ts
 * Attach prototype methods to RecursionDetector
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import { RecursionDetector } from '../recursion-detector.js';
import { checkRecursion } from './check-recursion.js';
import { clear } from './clear.js';
import { enterComponent } from './enter-component.js';
import { exitComponent } from './exit-component.js';
import { getCallStack } from './get-call-stack.js';

// Attach methods to prototype
RecursionDetector.prototype.enterComponent = enterComponent;
RecursionDetector.prototype.exitComponent = exitComponent;
RecursionDetector.prototype.checkRecursion = checkRecursion;
RecursionDetector.prototype.getCallStack = getCallStack;
RecursionDetector.prototype.clear = clear;
