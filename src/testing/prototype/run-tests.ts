/**
 * Run Tests Prototype Method
 *
 * Executes multiple PSR tests.
 */

import type {
    IPSRTestInput,
    IPSRTestResult,
    IPSRTestRunnerInternal,
} from '../psr-test-runner.types.js'

export async function runTests(
  this: IPSRTestRunnerInternal,
  inputs: IPSRTestInput[]
): Promise<IPSRTestResult[]> {
  const results: IPSRTestResult[] = [];

  for (const input of inputs) {
    const result = await this.runTest(input);
    results.push(result);

    if (this._config.stopOnFailure && !result.passed) {
      if (this._config.verbose) {
        console.log('\n⚠️  Stopping on first failure');
      }
      break;
    }
  }

  if (this._config.verbose) {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`\n=== Test Summary ===`);
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${passed} ✓`);
    console.log(`Failed: ${failed} ✗`);
  }

  return results;
}
