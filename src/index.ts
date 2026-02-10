/**
 * Main Pipeline Entry Point
 * Wires together Lexer → Parser → CodeGenerator
 *
 * CURRENT ARCHITECTURE (3 phases - monolithic):
 * ┌────────────────────────────────────────────────────┐
 * │  Phase 1: Lexer (Tokenization)                     │
 * │  Phase 2: Parser (AST Generation)                  │
 * │  Phase 3: CodeGenerator (Transform + Emit)         │
 * │           ↑ Does BOTH transformation & emission    │
 * └────────────────────────────────────────────────────┘
 *
 * FUTURE IMPROVEMENT (5 phases - clean separation):
 * ┌────────────────────────────────────────────────────┐
 * │  Phase 1: Lexer                                    │
 * │  Phase 2: Parser                                   │
 * │  Phase 3: Semantic Analyzer (optional)             │
 * │  Phase 4: Transformer (AST → AST)                  │
 * │  Phase 5: CodeGenerator (AST → string)             │
 * └────────────────────────────────────────────────────┘
 *
 * Current approach WORKS (84.5% tests passing).
 * Separate transformer would improve architecture but isn't required.
 */

import { createCodeGenerator } from './code-generator/index.js';
import { createLogger, type LogChannel, type LogLevel } from './debug/logger.js';
import { createLexer } from './lexer/index.js';
import { createParser } from './parser/index.js';

/**
 * Pipeline options
 */
export interface IPipelineOptions {
  filePath?: string;
  debug?: boolean;
  debugLevel?: LogLevel;
  debugChannels?: LogChannel[];
  useTransformer?: boolean;
}

/**
 * Pipeline result
 */
export interface IPipelineResult {
  code: string;
  diagnostics: IDiagnostic[];
  metrics?: IPipelineMetrics;
}

export interface IDiagnostic {
  type: 'error' | 'warning' | 'info';
  phase: string;
  message: string;
  line?: number;
  column?: number;
}

export interface IPipelineMetrics {
  lexerTime: number;
  parserTime: number;
  transformTime: number;
  totalTime: number;
}

/**
 * Create transformation pipeline
 */
export function createPipeline(options: IPipelineOptions = {}) {
  // Create logger instance
  const logger = createLogger({
    enabled: options.debug ?? false,
    level: options.debugLevel ?? 'debug',
    channels: options.debugChannels ?? [],
    timestamps: true,
    colors: true,
    performance: true,
  });

  return {
    transform: async (source: string): Promise<IPipelineResult> => {
      logger.info('pipeline', '🚀 Starting PSR transformation');
      logger.debug('pipeline', `Input: ${source.length} characters`);

      const startTime = performance.now();
      const diagnostics: IDiagnostic[] = [];

      try {
        // Phase 1: Lexer
        logger.group('📝 Phase 1: Lexer');
        logger.time('Lexer');
        const lexerStartTime = performance.now();
        const lexer = createLexer(source, options.filePath);
        const tokens = lexer.scanTokens();
        const lexerTime = performance.now() - lexerStartTime;
        logger.timeEnd('Lexer');
        logger.info('lexer', `✅ Generated ${tokens.length} tokens`);
        logger.trace('lexer', 'Token stream', tokens.slice(0, 10));
        logger.groupEnd();

        // Phase 2: Parser
        logger.group('🌳 Phase 2: Parser');
        logger.time('Parser');
        const parserStartTime = performance.now();
        const parser = createParser(tokens, options.filePath);
        const ast = parser.parse();
        const parserTime = performance.now() - parserStartTime;
        logger.timeEnd('Parser');
        logger.info('parser', `✅ Generated AST with ${ast.body.length} statements`);
        logger.trace(
          'parser',
          'AST structure',
          ast.body.map((s: any) => s.type)
        );
        logger.groupEnd();

        // Phase 3: Transformer (optional)
        let transformedAst = ast;
        if (options.useTransformer) {
          logger.group('🔄 Phase 3: Transformer');
          logger.time('Transformer');
          const { createTransformer } = await import('./transformer/index.js');
          const transformer = createTransformer(ast, { sourceFile: options.filePath || 'unknown' });
          const transformResult = transformer.transform();
          transformedAst = transformResult.ast;
          logger.timeEnd('Transformer');
          logger.info(
            'transform',
            `✅ Transformed AST with ${transformedAst.body.length} statements`
          );
          if (transformResult.context.errors.length > 0) {
            logger.warn(
              'transform',
              `⚠️ ${transformResult.context.errors.length} errors during transformation`
            );
            transformResult.context.errors.forEach((err: any) => {
              logger.error('transform', err.message);
            });
          }
          logger.groupEnd();
        }

        // Phase 4: Code Generator
        logger.group('⚡ Phase 4: Code Generator');
        logger.time('CodeGenerator');
        const transformStartTime = performance.now();
        const generator = createCodeGenerator(transformedAst, { filePath: options.filePath });
        const code = generator.generate();
        const transformTime = performance.now() - transformStartTime;
        logger.timeEnd('CodeGenerator');
        logger.info('codegen', `✅ Generated ${code.length} characters`);
        logger.trace('codegen', 'First 200 chars', code.slice(0, 200));
        logger.groupEnd();

        const totalTime = performance.now() - startTime;

        logger.info('pipeline', `✨ Transformation complete in ${totalTime.toFixed(2)}ms`);
        logger.debug('pipeline', 'Performance breakdown:', {
          lexer: `${lexerTime.toFixed(2)}ms`,
          parser: `${parserTime.toFixed(2)}ms`,
          codegen: `${transformTime.toFixed(2)}ms`,
          total: `${totalTime.toFixed(2)}ms`,
        });

        return {
          code,
          diagnostics,
          metrics: {
            lexerTime,
            parserTime,
            transformTime,
            totalTime,
          },
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('pipeline', '❌ Transformation failed', { error: errorMsg });
        diagnostics.push({
          type: 'error',
          phase: 'Pipeline',
          message: errorMsg,
        });

        return {
          code: '',
          diagnostics,
        };
      }
    },
  };
}

// Export for backwards compatibility
export { createCodeGenerator } from './code-generator/index.js';
export { createLogger, type ILogger, type LogChannel, type LogLevel } from './debug/logger.js';
export { createLexer } from './lexer/index.js';
export { createParser } from './parser/index.js';
export { SemanticAnalyzer, type ISemanticAnalyzer } from './semantic-analyzer/index.js';
export type {
  IScope,
  ISemanticAnalysisResult,
  ISemanticError,
  ISymbol,
  ISymbolTable,
} from './semantic-analyzer/index.js';
export { createTransformer, Transformer, type ITransformer } from './transformer/index.js';
export type { ITransformContext, ITransformError, ITransformResult } from './transformer/index.js';
