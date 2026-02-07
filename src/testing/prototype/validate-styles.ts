/**
 * Validate Styles Prototype Method
 *
 * Validates CSS styles against expectations.
 */

import type {
    IPSRTestRunnerInternal,
    IStyleAssertion,
    ITestContext,
    IValidationResult,
} from '../psr-test-runner.types.js'

export async function _validateStyles(
  this: IPSRTestRunnerInternal,
  context: ITestContext,
  assertion: IStyleAssertion
): Promise<IValidationResult> {
  try {
    const element = context.query(assertion.selector);

    if (!element) {
      return {
        passed: false,
        assertion: `Element exists: ${assertion.selector}`,
        expected: 'Element to exist',
        actual: 'Element not found',
        errorMessage: `Element with selector "${assertion.selector}" not found`,
      };
    }

    // Validate computed styles
    if (assertion.computedStyles) {
      const computedStyle = globalThis.window.getComputedStyle(element);

      for (const [property, expectedValue] of Object.entries(assertion.computedStyles)) {
        const actualValue = computedStyle.getPropertyValue(property);

        if (actualValue !== expectedValue) {
          return {
            passed: false,
            assertion: `Computed style ${property}: ${assertion.selector}`,
            expected: expectedValue,
            actual: actualValue,
            errorMessage: `Expected computed style "${property}" to be "${expectedValue}", got "${actualValue}"`,
          };
        }
      }
    }

    // Validate inline styles
    if (assertion.inlineStyles) {
      const inlineStyle = (element as HTMLElement).style;

      for (const [property, expectedValue] of Object.entries(assertion.inlineStyles)) {
        const actualValue = inlineStyle.getPropertyValue(property);

        if (actualValue !== expectedValue) {
          return {
            passed: false,
            assertion: `Inline style ${property}: ${assertion.selector}`,
            expected: expectedValue,
            actual: actualValue,
            errorMessage: `Expected inline style "${property}" to be "${expectedValue}", got "${actualValue}"`,
          };
        }
      }
    }

    // Validate class presence
    if (assertion.hasClasses) {
      for (const className of assertion.hasClasses) {
        if (!element.classList.contains(className)) {
          return {
            passed: false,
            assertion: `Has class "${className}": ${assertion.selector}`,
            expected: `Class "${className}" present`,
            actual: `Class not found. Classes: ${Array.from(element.classList).join(', ')}`,
            errorMessage: `Expected element to have class "${className}"`,
          };
        }
      }
    }

    // Validate class absence
    if (assertion.missingClasses) {
      for (const className of assertion.missingClasses) {
        if (element.classList.contains(className)) {
          return {
            passed: false,
            assertion: `Missing class "${className}": ${assertion.selector}`,
            expected: `Class "${className}" absent`,
            actual: `Class found. Classes: ${Array.from(element.classList).join(', ')}`,
            errorMessage: `Expected element NOT to have class "${className}"`,
          };
        }
      }
    }

    return {
      passed: true,
      assertion: `Style validation: ${assertion.selector}`,
      expected: 'All style assertions pass',
      actual: 'All style assertions passed',
    };
  } catch (error) {
    return {
      passed: false,
      assertion: `Style validation: ${assertion.selector}`,
      expected: 'Validation to complete',
      actual: 'Error during validation',
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}
