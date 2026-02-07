/**
 * Emitter Integration - Reactivity Analyzer
 *
 * Integrates reactivity analyzer into emitter.
 * Handles signal/memo/effect transformations during code generation.
 */

import type { ImportManager } from '../analyzer/import-manager.js';
import {
  createReactivityAnalyzer,
  detectReactivityPatterns,
  extractReactiveBindings,
  type ReactiveBinding,
  type ReactivityAnalyzer,
} from '../analyzer/reactivity-analyzer.js';

/**
 * Emitter with reactivity analysis capabilities
 */
export interface EmitterWithReactivity {
  /** Reactivity analyzer instance */
  reactivity: ReactivityAnalyzer;

  /** Transform code with reactivity */
  transformReactiveCode(code: string): string;

  /** Analyze and inject runtime imports */
  analyzeReactivityImports(code: string, imports: ImportManager): void;

  /** Get reactive bindings */
  getReactiveBindings(): ReactiveBinding[];
}

/**
 * Create emitter with reactivity analysis
 */
export function createEmitterWithReactivity(): EmitterWithReactivity {
  const reactivity = createReactivityAnalyzer();

  return {
    reactivity,

    transformReactiveCode(code: string): string {
      let transformed = code;

      // Transform signal() => createSignal()
      transformed = reactivity.transformSignal(transformed);

      // Transform computed() => createMemo()
      transformed = reactivity.transformComputed(transformed);

      // Transform effect() => createEffect()
      transformed = reactivity.transformEffect(transformed);

      return transformed;
    },

    analyzeReactivityImports(code: string, imports: ImportManager): void {
      const patterns = detectReactivityPatterns(code);

      if (patterns.hasSignals) {
        imports.addNamedImport('createSignal', '@pulsar/runtime');
      }

      if (patterns.hasMemos) {
        imports.addNamedImport('createMemo', '@pulsar/runtime');
      }

      if (patterns.hasEffects) {
        imports.addNamedImport('createEffect', '@pulsar/runtime');
      }

      if (patterns.hasResources) {
        imports.addNamedImport('createResource', '@pulsar/runtime');
      }

      if (patterns.hasStore) {
        imports.addNamedImport('createStore', '@pulsar/runtime');
      }
    },

    getReactiveBindings(): ReactiveBinding[] {
      const allBindings: ReactiveBinding[] = [];

      for (const scope of reactivity.getScopes()) {
        allBindings.push(...Array.from(scope.bindings.values()));
      }

      return allBindings;
    },
  };
}

/**
 * Transform reactive code and auto-inject imports
 */
export function transformWithReactivity(
  code: string,
  imports: ImportManager
): { code: string; bindings: ReactiveBinding[] } {
  const emitter = createEmitterWithReactivity();

  // Extract bindings before transformation
  const bindings = extractReactiveBindings(code);

  // Transform code
  const transformed = emitter.transformReactiveCode(code);

  // Inject imports
  emitter.analyzeReactivityImports(transformed, imports);

  return {
    code: transformed,
    bindings,
  };
}

/**
 * Generate dependency tracking comments
 */
export function generateDependencyComments(
  bindings: ReactiveBinding[],
  reactivity: ReactivityAnalyzer
): string {
  const comments: string[] = [];

  for (const binding of bindings) {
    const tracking = reactivity.generateDependencyTracking(binding.name);
    if (tracking) {
      comments.push(tracking);
    }
  }

  return comments.join('\n\n');
}
