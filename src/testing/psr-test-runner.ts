/**
 * PSR Test Runner Constructor
 *
 * Prototype-based test runner for PSR transformation and runtime validation.
 */

import { createPipeline } from '../pipeline/create-pipeline.js'
import type {
    IPSRTestResult,
    IPSRTestRunnerConfig,
    IPSRTestRunnerInternal as IPSRTestRunnerInternalTypes,
} from './psr-test-runner.types.js'

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<IPSRTestRunnerConfig> = {
  verbose: false,
  defaultTimeout: 1000,
  autoCleanup: true,
  customRegistry: null,
  enableProfiling: false,
  stopOnFailure: false,
};

/**
 * PSRTestRunner constructor (prototype-based)
 */
export const PSRTestRunner = function (
  this: IPSRTestRunnerInternalTypes,
  config?: IPSRTestRunnerConfig
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  Object.defineProperty(this, '_config', {
    value: finalConfig,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_pipeline', {
    value: createPipeline({ debug: finalConfig.verbose }),
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_testResults', {
    value: [] as IPSRTestResult[],
    writable: true,
    enumerable: false,
    configurable: false,
  });
} as any as new (config?: IPSRTestRunnerConfig) => IPSRTestRunnerInternalTypes;
