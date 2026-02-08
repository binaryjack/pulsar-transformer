/**
 * Emitter Constructor
 *
 * Main code emitter for generating TypeScript from IR.
 */

import { createImportTracker } from './create-import-tracker.js';
import type { IEmitContext, IEmitterConfig, IEmitterInternal } from './emitter.types.js';

/**
 * Default emitter configuration
 */
const DEFAULT_CONFIG: Required<IEmitterConfig> = {
  format: 'esm',
  indent: '  ',
  sourceMaps: false,
  minify: false,
  runtimePaths: {
    core: '@pulsar-framework/pulsar.dev',
    jsxRuntime: '@pulsar-framework/pulsar.dev/jsx-runtime',
    registry: '@pulsar-framework/pulsar.dev/registry',
  },
};

/**
 * Emitter constructor (prototype-based)
 */
export const Emitter = function (this: IEmitterInternal, config?: IEmitterConfig) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Initialize context
  const context: IEmitContext = {
    config: finalConfig,
    imports: createImportTracker(),
    indentLevel: 0,
    code: [],
    usedNames: new Set(),
    elementCounter: 0,
    _debugIterationCount: 0,
    _maxIterations: 5000, // Reduced from 100000 to trigger error faster
  };

  Object.defineProperty(this, 'context', {
    value: context,
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: IEmitterConfig): IEmitterInternal };
