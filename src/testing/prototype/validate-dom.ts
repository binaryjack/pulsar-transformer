/**
 * Validate DOM Prototype Method
 *
 * Validates DOM structure against expectations.
 */

import type {
    IDOMAssertion,
    IPSRTestRunnerInternal,
    ITestContext,
    IValidationResult,
} from '../psr-test-runner.types.js'

export async function _validateDOM(
  this: IPSRTestRunnerInternal,
  context: ITestContext,
  assertion: IDOMAssertion
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

    // Validate tag name
    if (assertion.tagName) {
      const actualTagName = element.tagName.toLowerCase();
      const expectedTagName = assertion.tagName.toLowerCase();

      if (actualTagName !== expectedTagName) {
        return {
          passed: false,
          assertion: `Tag name: ${assertion.selector}`,
          expected: expectedTagName,
          actual: actualTagName,
          errorMessage: `Expected tag "${expectedTagName}", got "${actualTagName}"`,
        };
      }
    }

    // Validate text content
    if (assertion.textContent !== undefined) {
      const actualText = element.textContent?.trim() || '';
      const expectedText = assertion.textContent.trim();

      if (actualText !== expectedText) {
        return {
          passed: false,
          assertion: `Text content: ${assertion.selector}`,
          expected: expectedText,
          actual: actualText,
          errorMessage: `Expected text "${expectedText}", got "${actualText}"`,
        };
      }
    }

    // Validate attributes
    if (assertion.attributes) {
      for (const [attrName, expectedValue] of Object.entries(assertion.attributes)) {
        const actualValue = element.getAttribute(attrName);

        if (actualValue !== expectedValue) {
          return {
            passed: false,
            assertion: `Attribute ${attrName}: ${assertion.selector}`,
            expected: expectedValue,
            actual: actualValue,
            errorMessage: `Expected attribute "${attrName}" to be "${expectedValue}", got "${actualValue}"`,
          };
        }
      }
    }

    // Validate children count
    if (assertion.childrenCount !== undefined) {
      const actualCount = element.children.length;

      if (actualCount !== assertion.childrenCount) {
        return {
          passed: false,
          assertion: `Children count: ${assertion.selector}`,
          expected: assertion.childrenCount,
          actual: actualCount,
          errorMessage: `Expected ${assertion.childrenCount} children, got ${actualCount}`,
        };
      }
    }

    // Validate class list
    if (assertion.classList) {
      for (const className of assertion.classList) {
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

    // Custom assertion
    if (assertion.customAssertion) {
      try {
        assertion.customAssertion(element);
      } catch (error) {
        return {
          passed: false,
          assertion: `Custom DOM assertion: ${assertion.selector}`,
          expected: 'Custom assertion to pass',
          actual: error instanceof Error ? error.message : String(error),
          errorMessage: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return {
      passed: true,
      assertion: `DOM validation: ${assertion.selector}`,
      expected: 'All assertions pass',
      actual: 'All assertions passed',
    };
  } catch (error) {
    return {
      passed: false,
      assertion: `DOM validation: ${assertion.selector}`,
      expected: 'Validation to complete',
      actual: 'Error during validation',
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}
