/**
 * Get Config Prototype Method
 *
 * Returns the current configuration.
 */

import type { IPSRTestRunnerConfig, IPSRTestRunnerInternal } from '../psr-test-runner.types.js'

export function getConfig(this: IPSRTestRunnerInternal): IPSRTestRunnerConfig {
  return { ...this._config };
}
