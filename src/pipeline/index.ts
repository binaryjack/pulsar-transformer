/**
 * Pipeline Module Exports
 *
 * Public API for PSR → TypeScript transformation pipeline.
 */

export { createPipeline } from './create-pipeline.js';
export type {
  IPipeline,
  IPipelineConfig,
  IPipelineDiagnostic,
  IPipelineMetrics,
  IPipelineResult,
} from './pipeline.types.js';
