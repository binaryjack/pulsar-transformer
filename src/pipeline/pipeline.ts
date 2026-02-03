/**
 * Pipeline Constructor
 *
 * Main PSR → TypeScript transformation pipeline.
 */

import type { IPipelineConfig, IPipelineInternal } from './pipeline.types.js';

/**
 * Pipeline constructor
 */
export const Pipeline = function (this: IPipelineInternal, config?: IPipelineConfig) {
  // Store configuration
  Object.defineProperty(this, 'config', {
    value: config || {},
    writable: false,
    enumerable: false,
    configurable: false,
  });

  // Initialize diagnostics array
  Object.defineProperty(this, 'diagnostics', {
    value: [],
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: IPipelineConfig): IPipelineInternal };
