/**
 * TransformationReporter.displayWarnings() - Prototype Method
 *
 * Displays all warnings with beautiful console formatting using box-drawing characters.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type {
  ITransformationReporterInternal,
  ITransformationIssue,
  IDetectionResult,
} from '../transformation-reporter.types.js';

/**
 * Display all warnings with beautiful formatting
 *
 * Uses box-drawing characters (┌ ├ └ │) for structured output.
 * Shows component name, location, message, suggestions, and examples.
 */
export function displayWarnings(this: ITransformationReporterInternal): void {
  if (this._warnings.length === 0) {
    return;
  }

  console.warn('\n');
  console.warn('┌─────────────────────────────────────────────────────────────');
  console.warn('│ ⚠️  PULSAR TRANSFORMATION WARNINGS');
  console.warn('├─────────────────────────────────────────────────────────────');

  this._warnings.forEach((warning: ITransformationIssue, index: number) => {
    if (index > 0) {
      console.warn('├─────────────────────────────────────────────────────────────');
    }

    // Component name (if available)
    if (warning.component) {
      console.warn(`│ Component: ${warning.component}`);
    }

    // Location
    console.warn(
      `│ Location:  ${warning.location.file}:${warning.location.line}:${warning.location.column}`
    );

    // Warning type
    console.warn(`│ Type:      ${warning.type}`);

    // Message
    console.warn(`│`);
    console.warn(`│ Warning:`);
    const messageLines = warning.message.split('\n');
    messageLines.forEach((line: string) => {
      console.warn(`│   ${line}`);
    });

    // Suggestion (if available)
    if (warning.suggestion) {
      console.warn(`│`);
      console.warn(`│ Suggestion:`);
      const suggestionLines = warning.suggestion.split('\n');
      suggestionLines.forEach((line: string) => {
        console.warn(`│   ${line}`);
      });
    }

    // Example before (if available)
    if (warning.exampleBefore) {
      console.warn(`│`);
      console.warn(`│ ❌ Before:`);
      const beforeLines = warning.exampleBefore.split('\n');
      beforeLines.forEach((line: string) => {
        console.warn(`│   ${line}`);
      });
    }

    // Example after (if available)
    if (warning.exampleAfter) {
      console.warn(`│`);
      console.warn(`│ ✅ After:`);
      const afterLines = warning.exampleAfter.split('\n');
      afterLines.forEach((line: string) => {
        console.warn(`│   ${line}`);
      });
    }

    // Detection results (if available)
    if (warning.detectionResults && warning.detectionResults.length > 0) {
      console.warn(`│`);
      console.warn(`│ Detection Results:`);
      warning.detectionResults.forEach((result: IDetectionResult) => {
        const status = result.passed ? '✅' : '❌';
        console.warn(`│   ${status} ${result.strategy}: ${result.reason || 'passed'}`);
      });
    }
  });

  console.warn('└─────────────────────────────────────────────────────────────');
  console.warn(`  Total Warnings: ${this._warnings.length}`);
  console.warn('\n');
}
