/**
 * Test Event Prototype Method
 *
 * Tests event handlers work as expected.
 */

import type {
  IEventTest,
  IEventTestResult,
  IPSRTestRunnerInternal,
  ITestContext,
} from '../psr-test-runner.types.js';

export async function _testEvent(
  this: IPSRTestRunnerInternal,
  context: ITestContext,
  test: IEventTest
): Promise<IEventTestResult> {
  const result: IEventTestResult = {
    description: test.description,
    eventTriggered: false,
    passed: false,
    validations: [],
  };

  try {
    const element = context.query(test.selector);

    if (!element) {
      result.error = `Element not found: ${test.selector}`;
      return result;
    }

    // Trigger event
    const event = new Event(test.eventType, test.eventInit);
    element.dispatchEvent(event);
    result.eventTriggered = true;

    // Wait for updates
    await context.waitForUpdate(100);

    // Validate expected behavior
    for (const expectedBehavior of test.expectedBehavior) {
      const validation = await this._validateDOM(context, expectedBehavior);
      result.validations.push(validation);
    }

    result.passed = result.validations.every((v) => v.passed);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.passed = false;
  }

  return result;
}
