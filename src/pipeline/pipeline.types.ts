/**
 * Pipeline Type Definitions
 *
 * Types for the PSR → TypeScript transformation pipeline.
 */

import type { IEmitterConfig } from '../emitter/emitter.types.js';

/**
 * Pipeline configuration
 */
export interface IPipelineConfig {
  /**
   * Emitter configuration
   */
  emitter?: IEmitterConfig;

  /**
   * Enable debug output
   */
  debug?: boolean;

  /**
   * Source file path (for error messages)
   */
  filePath?: string;
}

/**
 * Pipeline result
 */
export interface IPipelineResult {
  /**
   * Generated TypeScript code
   */
  code: string;

  /**
   * Source map (if enabled)
   */
  sourceMap?: unknown;

  /**
   * Transformation diagnostics
   */
  diagnostics: IPipelineDiagnostic[];

  /**
   * Performance metrics
   */
  metrics?: IPipelineMetrics;
}

/**
 * Pipeline diagnostic message
 */
export interface IPipelineDiagnostic {
  type: 'error' | 'warning' | 'info';
  message: string;
  phase: 'lexer' | 'parser' | 'analyzer' | 'transform' | 'emitter';
  location?: {
    line: number;
    column: number;
  };
}

/**
 * Pipeline performance metrics
 */
export interface IPipelineMetrics {
  lexerTime: number;
  parserTime: number;
  analyzerTime: number;
  transformTime: number;
  emitterTime: number;
  totalTime: number;
}

/**
 * Pipeline instance
 */
export interface IPipeline {
  /**
   * Transform PSR source to TypeScript
   */
  transform(source: string, config?: IPipelineConfig): IPipelineResult;

  /**
   * Get pipeline configuration
   */
  getConfig(): IPipelineConfig;
}

/**
 * Internal pipeline implementation
 */
export interface IPipelineInternal extends IPipeline {
  config: IPipelineConfig;
  diagnostics: IPipelineDiagnostic[];
}
