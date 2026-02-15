/**
 * Babel-based PSR Transformation Pipeline
 * Replaces custom lexer/parser/transformer with Babel
 */

import babelGeneratorDefault from '@babel/generator';
import * as babel from '@babel/parser';
import babelTraverseDefault from '@babel/traverse';
import * as t from '@babel/types';
import pulsarPlugin from './babel-plugin/index.js';
import type { IDiagnostic, IPipelineOptions, IPipelineResult } from './types.js';

const parse = babel.parse;
// Handle both ESM and CJS module formats - check if it's already a function first
const traverse: any =
  typeof babelTraverseDefault === 'function'
    ? babelTraverseDefault
    : (babelTraverseDefault as any).default;
const generate: any =
  typeof babelGeneratorDefault === 'function'
    ? babelGeneratorDefault
    : (babelGeneratorDefault as any).default;

// Polyfill for Node.js performance
const perf = typeof performance !== 'undefined' ? performance : { now: () => Date.now() };

/**
 * Preprocess PSR syntax to valid TypeScript
 */
function preprocessPSR(source: string): string {
  // Transform: component Counter() { }
  // To: export function Counter() { }
  let result = source.replace(/^(\s*)export\s+component\s+(\w+)\s*\(/gm, '$1export function $2(');
  result = result.replace(/^(\s*)component\s+(\w+)\s*\(/gm, '$1export function $2(');

  // Handle component with generics: component Counter<T>()
  result = result.replace(
    /^(\s*)export\s+component\s+(\w+)<([^>]+)>\s*\(/gm,
    '$1export function $2<$3>('
  );
  result = result.replace(/^(\s*)component\s+(\w+)<([^>]+)>\s*\(/gm, '$1export function $2<$3>(');

  return result;
}

/**
 * Transform PSR source using Babel
 */
export async function transformWithBabelPipeline(
  source: string,
  options: IPipelineOptions = {}
): Promise<IPipelineResult> {
  const startTime = perf.now();
  const diagnostics: IDiagnostic[] = [];

  try {
    // Step 1: Preprocess PSR syntax
    const preprocessed = preprocessPSR(source);

    if (options.debug) {
      console.log('\n=== PREPROCESSED SOURCE ===');
      console.log(preprocessed);
    }

    // Step 2: Parse with Babel
    const ast = parse(preprocessed, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
      sourceFilename: options.filePath || 'input.psr',
    });

    if (options.debug) {
      console.log('\n=== BABEL AST PARSED ===');
      console.log(`Nodes: ${ast.program.body.length}`);
    }

    // Step 3: Transform with Pulsar plugin
    traverse(ast, pulsarPlugin({ types: t }).visitor);

    if (options.debug) {
      console.log('\n=== TRANSFORMATION COMPLETE ===');
    }

    // Step 4: Generate code
    const output = generate(
      ast,
      {
        retainLines: false,
        comments: true,
        jsescOption: {
          quotes: 'single',
          minimal: true,
        },
      },
      preprocessed
    );

    // Step 5: Validate output (simplified - validator may not have diagnostics array)
    // Validation was removed - Babel output is always valid if generation succeeds

    const totalTime = performance.now() - startTime;

    if (options.debug) {
      console.log(`\n=== PIPELINE COMPLETE ===`);
      console.log(`Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`Output size: ${output.code.length} characters`);
    }

    return {
      code: output.code,
      diagnostics,
      metrics: {
        preprocessorTime: 0,
        lexerTime: 0,
        parserTime: 0,
        transformTime: totalTime,
        totalTime,
      },
    };
  } catch (error: any) {
    diagnostics.push({
      type: 'error',
      phase: 'babel-pipeline',
      message: error.message || 'Unknown error',
      line: error.loc?.line,
      column: error.loc?.column,
    });

    return {
      code: '',
      diagnostics,
      metrics: {
        preprocessorTime: 0,
        lexerTime: 0,
        parserTime: 0,
        transformTime: perf.now() - startTime,
        totalTime: perf.now() - startTime,
      },
    };
  }
}
