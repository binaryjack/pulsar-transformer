/**
 * Analyzer public API exports
 */

export type {
  IAnalyzer,
  IAnalyzerConfig,
  IAnalyzerContext,
  IAnalyzerError,
} from './analyzer.types.js';
export { createAnalyzer } from './create-analyzer.js';
export * from './ir/index.js';
