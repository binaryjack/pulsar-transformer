/**
 * Test Reactivity Prototype Method
 *
 * Tests that reactivity works as expected (signal updates trigger DOM updates).
 */

import type {
    IPSRTestRunnerInternal,
    IReactivityTest,
    IReactivityTestResult,
    ITestContext,
} from '../psr-test-runner.types.js'

export async function _testReactivity(
  this: IPSRTestRunnerInternal,
  context: ITestContext,
  test: IReactivityTest
): Promise<IReactivityTestResult> {
  const result: IReactivityTestResult = {
    description: test.description,
    passed: false,
    validations: [],
  };

  try {
    // Capture initial DOM state
    const initialStates = test.expectedChanges.map((change) => ({
      selector: change.selector,
      element: context.query(change.selector),
      textContent: context.query(change.selector)?.textContent,
    }));

    // Trigger the state change
    test.trigger(context);

    // Wait for updates
    await context.waitForUpdate(test.timeout || this._config.defaultTimeout);

    // Validate expected changes
    for (const expectedChange of test.expectedChanges) {
      const validation = await this._validateDOM(context, expectedChange);
      result.validations.push(validation);
    }

    result.passed = result.validations.every((v) => v.passed);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.passed = false;
  }

  return result;
}
