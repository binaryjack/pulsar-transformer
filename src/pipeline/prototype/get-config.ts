/**
 * Get Config Method
 *
 * Returns pipeline configuration.
 */

import type { IPipelineConfig, IPipelineInternal } from '../pipeline.types.js';

/**
 * Get pipeline configuration
 */
export function getConfig(this: IPipelineInternal): IPipelineConfig {
  return this.config;
}
