/**
 * Testing Module Exports
 *
 * Public API for PSR transformation testing utilities.
 */

export { createPSRTestRunner } from './create-psr-test-runner.js';

export type {
  IDOMAssertion,
  IEventTest,
  IEventTestResult,
  IPSRTestInput,
  IPSRTestResult,
  IPSRTestRunner,
  IPSRTestRunnerConfig,
  IReactivityTest,
  IReactivityTestResult,
  IRegistryMock,
  IStyleAssertion,
  ITestContext,
  ITestError,
  IValidationResult,
} from './psr-test-runner.types.js';
