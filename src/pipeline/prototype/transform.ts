/**
 * Transform Method
 *
 * Main pipeline transformation: PSR → TypeScript.
 */

import { createAnalyzer } from '../../analyzer/create-analyzer.js';
import { createEmitter } from '../../emitter/create-emitter.js';
import type { IProgramNode } from '../../parser/ast/ast-node-types.js';
import { createParser } from '../../parser/create-parser.js';
import { createLexer } from '../../parser/lexer/create-lexer.js';
import type {
  IPipelineConfig,
  IPipelineDiagnostic,
  IPipelineInternal,
  IPipelineResult,
} from '../pipeline.types.js';

/**
 * Transform PSR source to TypeScript
 */
export function transform(
  this: IPipelineInternal,
  source: string,
  config?: IPipelineConfig
): IPipelineResult {
  const startTime = performance.now();
  const diagnostics: IPipelineDiagnostic[] = [];
  const metrics = {
    lexerTime: 0,
    parserTime: 0,
    analyzerTime: 0,
    transformTime: 0,
    emitterTime: 0,
    totalTime: 0,
  };

  const finalConfig = { ...this.config, ...config };

  try {
    // Phase 1: Lexer - Tokenize source (for metrics only)
    const lexerStart = performance.now();
    const lexer = createLexer();
    const tokens = lexer.tokenize(source);
    metrics.lexerTime = performance.now() - lexerStart;

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Lexer: ${tokens ? tokens.length : 'NO TOKENS'} tokens generated`,
        phase: 'lexer',
      });
    }

    // Phase 2: Parser - Build AST (parser does its own tokenization)
    const parserStart = performance.now();
    const parser = createParser();
    const ast = parser.parse(source);
    metrics.parserTime = performance.now() - parserStart;

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Parser: AST with ${(ast as IProgramNode).body.length} nodes`,
        phase: 'parser',
      });
    }

    // Phase 3: Analyzer - Build IR
    const analyzerStart = performance.now();
    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);
    metrics.analyzerTime = performance.now() - analyzerStart;

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Analyzer: IR generated`,
        phase: 'analyzer',
      });
    }

    // Phase 4: Transform - Optimize IR (skipped for now - strategies need proper orchestration)
    const transformStart = performance.now();
    // TODO: Implement proper IR transformation orchestration
    const optimizedIR = ir; // Pass through for now
    metrics.transformTime = performance.now() - transformStart;

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Transform: IR pass-through (optimization pending)`,
        phase: 'transform',
      });
    }

    // Phase 5: Emitter - Generate TypeScript
    const emitterStart = performance.now();
    const emitter = createEmitter(finalConfig.emitter);

    if (!optimizedIR) {
      throw new Error('Analyzer returned undefined IR');
    }

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Emitter: Received IR type ${optimizedIR.type}`,
        phase: 'emitter',
      });
    }

    const code = emitter.emit(optimizedIR);
    metrics.emitterTime = performance.now() - emitterStart;

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Emitter: ${code.split('\n').length} lines generated`,
        phase: 'emitter',
      });
    }

    // Calculate total time
    metrics.totalTime = performance.now() - startTime;

    return {
      code,
      diagnostics,
      metrics: finalConfig.debug ? metrics : undefined,
    };
  } catch (error) {
    // Handle pipeline errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    diagnostics.push({
      type: 'error',
      message: errorMessage,
      phase: 'parser', // Default phase
    });

    // Log stack for debugging
    if (finalConfig.debug && errorStack) {
      console.error('Pipeline error stack:', errorStack);
    }

    return {
      code: '',
      diagnostics,
    };
  }
}
