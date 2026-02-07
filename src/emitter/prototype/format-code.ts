/**
 * Format Code Helper Method
 *
 * Formats final output code with imports.
 */

import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Auto-inject runtime imports based on code analysis
 */
function autoInjectRuntimeImports(
  code: string,
  imports: { addImport: (source: string, specifier: string) => void },
  runtimePaths: { core?: string; jsxRuntime?: string; registry?: string }
): void {
  const core = runtimePaths.core || '@pulsar-framework/pulsar.dev';
  const jsxRuntime = runtimePaths.jsxRuntime || '@pulsar-framework/pulsar.dev/jsx-runtime';
  const registry = runtimePaths.registry || '@pulsar-framework/pulsar.dev';

  // JSX runtime
  if (/\bjsx\(/.test(code) || /\bjsxs\(/.test(code)) {
    imports.addImport(jsxRuntime, 'jsx');
    imports.addImport(jsxRuntime, 'jsxs');
  }

  if (/\bjsxDEV\(/.test(code)) {
    imports.addImport(jsxRuntime, 'jsxDEV');
  }

  if (/\bFragment\b/.test(code)) {
    imports.addImport(jsxRuntime, 'Fragment');
  }

  // Reactivity - use core runtime path
  if (/\bcreateSignal\(/.test(code)) {
    imports.addImport(core, 'createSignal');
  }

  if (/\bcreateMemo\(/.test(code)) {
    imports.addImport(core, 'createMemo');
  }

  if (/\bcreateEffect\(/.test(code)) {
    imports.addImport(core, 'createEffect');
  }

  if (/\bt_element\(/.test(code)) {
    imports.addImport(jsxRuntime, 't_element');
  }

  if (/\$REGISTRY/.test(code)) {
    imports.addImport(registry, '$REGISTRY');
  }
}

/**
 * Format final code
 */
export function _formatCode(this: IEmitterInternal): string {
  const parts: string[] = [];

  // Get generated code
  const generatedCode = this.context.code.join('\n');

  // Auto-inject runtime imports based on code analysis using configured paths
  const runtimePaths = this.context.config.runtimePaths || {
    core: '@pulsar-framework/pulsar.dev',
    jsxRuntime: '@pulsar-framework/pulsar.dev/jsx-runtime',
    registry: '@pulsar-framework/pulsar.dev',
  };

  autoInjectRuntimeImports(generatedCode, this.context.imports, runtimePaths);

  // Add imports
  const imports = this.context.imports.generateImports();
  if (imports) {
    parts.push(imports, '');
  }

  // Add generated code
  parts.push(generatedCode);

  return parts.join('\n');
}
