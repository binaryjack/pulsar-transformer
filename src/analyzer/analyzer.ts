/**
 * Analyzer Constructor
 *
 * Builds IR from AST with optimization analysis.
 */

import type { IAnalyzerConfig, IAnalyzerContext, IAnalyzerInternal } from './analyzer.types.js';

/**
 * Analyzer constructor function
 */
export const Analyzer = function (this: IAnalyzerInternal, config: IAnalyzerConfig) {
  // Store configuration
  Object.defineProperty(this, '_config', {
    value: config,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  // Initialize context
  Object.defineProperty(this, '_context', {
    value: {
      scopes: [],
      currentComponent: null,
      signals: new Set(),
      imports: new Map(),
      exports: new Set(),
      registryKeys: new Map(),
<<<<<<< HEAD
      _recursionDepth: 0,
      _iterationCount: 0,
      _maxIterations: 10000,
      _currentNode: 'root',
      logger: config.logger,
=======
      inJSXChildren: false,
>>>>>>> 35c9f2b349e0cba67b8785a5e666c2a86450ad27
    } as IAnalyzerContext,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  // Initialize errors array
  Object.defineProperty(this, '_errors', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config: IAnalyzerConfig): IAnalyzerInternal };
