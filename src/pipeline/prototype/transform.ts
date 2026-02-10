/**
 * Transform Method
 *
 * Main pipeline transformation: PSR → TypeScript.
 */

import { createAnalyzer } from '../../analyzer/create-analyzer.js';
import { createDebugLogger } from '../../debug/create-debug-logger.js';
import { createEmitter } from '../../emitter/create-emitter.js';
import type { IProgramNode } from '../../parser/ast/ast-node-types.js';
import { ASTNodeType } from '../../parser/ast/ast-node-types.js';
import { createParser } from '../../parser/create-parser.js';
import { createLexer } from '../../parser/lexer/create-lexer.js';
import { createValidator } from '../../validator/create-validator.js';
import type {
  IPipelineConfig,
  IPipelineDiagnostic,
  IPipelineInternal,
  IPipelineResult,
} from '../pipeline.types.js';

/**
 * Transform PSR source to TypeScript
 */
export async function transform(
  this: IPipelineInternal,
  source: string,
  config?: IPipelineConfig
): Promise<IPipelineResult> {
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

  // Initialize debug logger
  const logger = createDebugLogger({
    enabled: finalConfig.debug ?? false,
    console: true,
    collectLogs: finalConfig.debug ?? false,
    timestamps: true,
    performance: true,
    minLevel: finalConfig.debug ? 'trace' : 'info',
    ...finalConfig.debugLogger,
  });

  // Initialize validator
  const validator = createValidator({
    enabled: true,
    strict: finalConfig.strict ?? false,
    ...finalConfig.validator,
  });

  logger.log('pipeline', 'info', 'Starting transformation', {
    sourceLength: source.length,
    filePath: finalConfig.filePath,
  });

  try {
    // Phase 1: Lexer - Tokenize source
    logger.log('lexer', 'info', 'Tokenizing source');
    const lexerStart = performance.now();
    const lexer = createLexer();
    const tokens = lexer.tokenize(source);
    metrics.lexerTime = performance.now() - lexerStart;

    logger.log('lexer', 'info', `Generated ${tokens.length} tokens`, {
      tokenCount: tokens.length,
      duration: metrics.lexerTime,
    });

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Lexer: ${tokens.length} tokens generated`,
        phase: 'lexer',
      });
    }

    // Phase 2: Parser - Build AST
    logger.log('parser', 'info', 'Building AST');
    const parserStart = performance.now();
    const parser = createParser({
      logger,
      debug: finalConfig.debug,
    });
    const ast = parser.parse(source);
    metrics.parserTime = performance.now() - parserStart;

    const nodeCount = (ast as IProgramNode).body.length;
    logger.log('parser', 'info', `AST created with ${nodeCount} nodes`, {
      nodeCount,
      duration: metrics.parserTime,
    });

    // FIX #4: Always fail on parser errors (removed strict mode check)
    if (parser.hasErrors()) {
      const errors = parser.getErrors();
      logger.log('parser', 'error', `Parser encountered ${errors.length} errors`, { errors });

      errors.forEach((err) => {
        diagnostics.push({
          type: 'error',
          message: err.message,
          phase: 'parser',
          location: err.location,
        });
      });

      // Always throw on parser errors - never continue with broken AST
      const errorDetails = errors
        .map((e) => `  Line ${e.location?.line ?? '?'}:${e.location?.column ?? '?'} - ${e.message}`)
        .join('\n');
      throw new Error(`Parser failed with ${errors.length} errors:\n${errorDetails}`);
    }

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Parser: AST with ${nodeCount} nodes`,
        phase: 'parser',
      });
    }

    // Pass-through mode: Check if this file contains PSR components
    const hasComponents = (ast as IProgramNode).body.some(
      (node) => node && node.type === ASTNodeType.COMPONENT_DECLARATION
    );

    if (!hasComponents) {
      logger.log('pipeline', 'info', 'No PSR components found - returning source unchanged', {
        nodeCount,
      });

      diagnostics.push({
        type: 'info',
        message: 'No PSR components detected - source returned unchanged (pass-through mode)',
        phase: 'parser',
      });

      return {
        code: source,
        diagnostics,
        metrics: finalConfig.debug
          ? { ...metrics, totalTime: performance.now() - startTime }
          : undefined,
      };
    }

    logger.log('pipeline', 'info', `Found PSR components - proceeding with transformation`, {
      nodeCount,
    });

    // Phase 3: Analyzer - Build IR
    logger.log('analyzer', 'info', 'Building IR');
    const analyzerStart = performance.now();
    const analyzer = createAnalyzer({
      logger,
      debug: finalConfig.debug,
      ...finalConfig.analyzer,
    });
    const ir = analyzer.analyze(ast);
    metrics.analyzerTime = performance.now() - analyzerStart;

    logger.log('analyzer', 'info', 'IR generated', {
      irType: ir.type,
      duration: metrics.analyzerTime,
    });

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Analyzer: IR generated`,
        phase: 'analyzer',
      });
    }

    // Phase 4: Transform - Optimize IR
    logger.log('transform', 'info', 'Optimizing IR');
    const transformStart = performance.now();

    // Import reactivity transformer
    const { transformReactivity } = await import('../../transformer/reactivity-transformer.js');

    // Apply reactivity transformations (signal → createSignal, etc.)
    const optimizedIR = transformReactivity(ir);

    metrics.transformTime = performance.now() - transformStart;

    logger.log('transform', 'info', 'IR optimization complete (reactivity transformed)', {
      duration: metrics.transformTime,
    });

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Transform: IR pass-through (optimization pending)`,
        phase: 'transform',
      });
    }

    // Phase 5: Emitter - Generate TypeScript
    logger.log('emitter', 'info', 'Generating TypeScript');
    const emitterStart = performance.now();
    const emitter = createEmitter(finalConfig.emitter);

    // Inject logger into emitter context
    (emitter as any).context.logger = logger;

    if (!optimizedIR) {
      throw new Error('Analyzer returned undefined IR');
    }

    logger.log('emitter', 'debug', `Emitting IR type: ${optimizedIR.type}`);

    const code = emitter.emit(optimizedIR);
    metrics.emitterTime = performance.now() - emitterStart;

    const lineCount = code.split('\n').length;
    logger.log('emitter', 'info', `Generated ${lineCount} lines of code`, {
      lineCount,
      codeLength: code.length,
      duration: metrics.emitterTime,
    });

    if (finalConfig.debug) {
      diagnostics.push({
        type: 'info',
        message: `Emitter: ${lineCount} lines generated`,
        phase: 'emitter',
      });
    }

    // Phase 6: Validation
    logger.log('validator', 'info', 'Validating output');
    const validationResult = validator.validate(code, {
      sourceFile: finalConfig.filePath,
      originalCode: source,
      phase: 'post-transform',
    });

    logger.log(
      'validator',
      validationResult.valid ? 'info' : 'warn',
      `Validation: ${validationResult.errorCount} errors, ${validationResult.warningCount} warnings`,
      {
        valid: validationResult.valid,
        errorCount: validationResult.errorCount,
        warningCount: validationResult.warningCount,
      }
    );

    // Add validation issues to diagnostics
    validationResult.issues.forEach((issue) => {
      const location = issue.location
        ? {
            line: issue.location.line ?? 0,
            column: issue.location.column ?? 0,
          }
        : undefined;

      diagnostics.push({
        type:
          issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info',
        message: `[Validation] ${issue.message}`,
        phase: 'validator',
        location,
      });
    });

    // Fail if validation errors in strict mode
    if (!validationResult.valid && finalConfig.strict) {
      throw new Error(`Validation failed with ${validationResult.errorCount} errors`);
    }

    // Calculate total time
    metrics.totalTime = performance.now() - startTime;

    logger.log('pipeline', 'info', 'Transformation complete', {
      totalTime: metrics.totalTime,
      valid: validationResult.valid,
    });

    return {
      code,
      diagnostics,
      metrics: finalConfig.debug ? metrics : undefined,
      validation: validationResult,
    };
  } catch (error) {
    // Handle pipeline errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('pipeline', 'Transformation failed', error as Error);

    diagnostics.push({
      type: 'error',
      message: errorMessage,
      phase: 'pipeline',
    });

    // Log stack for debugging
    if (finalConfig.debug && errorStack) {
      console.error('[PIPELINE] Error stack:', errorStack);
    }

    return {
      code: '',
      diagnostics,
    };
  }
}
