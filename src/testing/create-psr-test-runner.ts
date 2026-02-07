/**
 * Create PSR Test Runner Factory
 *
 * Factory function for creating PSRTestRunner instances.
 */

import { PSRTestRunner } from './psr-test-runner.js'
import type { IPSRTestRunner, IPSRTestRunnerConfig } from './psr-test-runner.types.js'

// Attach prototype methods
import './prototype/index.js'

/**
 * Create a PSR test runner instance
 */
export function createPSRTestRunner(config?: IPSRTestRunnerConfig): IPSRTestRunner {
  return new PSRTestRunner(config) as unknown as IPSRTestRunner;
}
