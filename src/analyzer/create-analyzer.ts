/**
 * Analyzer factory function
 */

import { Analyzer } from './analyzer';
import type { IAnalyzer, IAnalyzerConfig } from './analyzer.types';
import './prototype'; // Ensure prototype methods attached

/**
 * Create an Analyzer instance
 *
 * @param config - Analyzer configuration
 * @returns Analyzer instance
 *
 * @example
 * const analyzer = createAnalyzer({ enableOptimizations: true });
 * const ir = analyzer.analyze(ast);
 */
export function createAnalyzer(config?: IAnalyzerConfig): IAnalyzer {
  return new Analyzer(config || {}) as unknown as IAnalyzer;
}
