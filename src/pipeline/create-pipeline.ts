/**
 * Create Pipeline Factory
 *
 * Factory function for creating Pipeline instances.
 */

import { Pipeline } from './pipeline.js';
import type { IPipeline, IPipelineConfig } from './pipeline.types.js';

// Attach prototype methods
import './prototype/index.js';

/**
 * Create a pipeline instance
 */
export function createPipeline(config?: IPipelineConfig): IPipeline {
  return new Pipeline(config) as unknown as IPipeline;
}
