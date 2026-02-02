/**
 * TransformationReporter.displayErrors() - Prototype Method
 *
 * Displays all errors with beautiful console formatting using box-drawing characters.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type {
  ITransformationReporterInternal,
  ITransformationIssue,
  IDetectionResult,
} from '../transformation-reporter.types.js';

/**
 * Display all errors with beautiful formatting
 *
 * Uses box-drawing characters (┌ ├ └ │) for structured output.
 * Shows component name, location, message, suggestions, and examples.
 */
export function displayErrors(this: ITransformationReporterInternal): void {
  if (this._errors.length === 0) {
    return;
  }

  console.error('\n');
  console.error('┌─────────────────────────────────────────────────────────────');
  console.error('│ ❌ PULSAR TRANSFORMATION ERRORS');
  console.error('├─────────────────────────────────────────────────────────────');

  this._errors.forEach((error: ITransformationIssue, index: number) => {
    if (index > 0) {
      console.error('├─────────────────────────────────────────────────────────────');
    }

    // Component name (if available)
    if (error.component) {
      console.error(`│ Component: ${error.component}`);
    }

    // Location
    console.error(
      `│ Location:  ${error.location.file}:${error.location.line}:${error.location.column}`
    );

    // Error type
    console.error(`│ Type:      ${error.type}`);

    // Message
    console.error(`│`);
    console.error(`│ Problem:`);
    const messageLines = error.message.split('\n');
    messageLines.forEach((line: string) => {
      console.error(`│   ${line}`);
    });

    // Suggestion (if available)
    if (error.suggestion) {
      console.error(`│`);
      console.error(`│ Suggestion:`);
      const suggestionLines = error.suggestion.split('\n');
      suggestionLines.forEach((line: string) => {
        console.error(`│   ${line}`);
      });
    }

    // Example before (if available)
    if (error.exampleBefore) {
      console.error(`│`);
      console.error(`│ ❌ Before:`);
      const beforeLines = error.exampleBefore.split('\n');
      beforeLines.forEach((line: string) => {
        console.error(`│   ${line}`);
      });
    }

    // Example after (if available)
    if (error.exampleAfter) {
      console.error(`│`);
      console.error(`│ ✅ After:`);
      const afterLines = error.exampleAfter.split('\n');
      afterLines.forEach((line: string) => {
        console.error(`│   ${line}`);
      });
    }

    // Detection results (if available)
    if (error.detectionResults && error.detectionResults.length > 0) {
      console.error(`│`);
      console.error(`│ Detection Results:`);
      error.detectionResults.forEach((result: IDetectionResult) => {
        const status = result.passed ? '✅' : '❌';
        console.error(`│   ${status} ${result.strategy}: ${result.reason || 'passed'}`);
      });
    }
  });

  console.error('└─────────────────────────────────────────────────────────────');
  console.error(`  Total Errors: ${this._errors.length}`);
  console.error('\n');
}
