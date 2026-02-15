/**
 * Main Pipeline Entry Point
 * Wires together Lexer → Parser → CodeGenerator (with optional Transformer)
 *
 * CURRENT ARCHITECTURE (4 phases - hybrid):
 * ┌────────────────────────────────────────────────────┐
 * │  Phase 1: Lexer (Tokenization)                     │
 * │  Phase 2: Parser (AST Generation)                  │
 * │  Phase 3: Transformer (AST → AST) [OPTIONAL]       │
 * │           ↑ Separate, but default: OFF             │
 * │  Phase 4: CodeGenerator (AST → JS string)          │
 * └────────────────────────────────────────────────────┘
 *
 * NOTES:
 * - Transformer is FULLY IMPLEMENTED but not used by default
 * - SemanticAnalyzer is FULLY IMPLEMENTED but not integrated yet
 * - CodeGenerator currently handles some transformation internally
 * - Set `useTransformer: true` to enable Phase 3
 *
 * STATUS: 84.5% tests passing without optional Transformer
 */

import { createCodeGenerator } from './code-generator/index.js';
import { createLogger, type LogChannel, type LogLevel } from './debug/logger.js';
import { getUnifiedTracker } from './debug/unified-tracker.js';
import { createLexer } from './lexer/index.js';
import { createParser } from './parser/index.js';
import {
  formatEncodingIssues,
  preprocessCharacterEncoding,
} from './preprocessor/character-encoding.js';
import { validateTransformationOutput } from './validator/transformation-validator.js';

// Initialize tracing (auto-instruments pipeline if PULSAR_TRACE=1)
import './init-tracing.js';

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

/**
 * Always print diagnostic summary to console (NOT behind debug flag)
 * This is CRITICAL user-facing information that should always be visible
 */
function printDiagnosticSummary(diagnostics: IDiagnostic[]): void {
  if (diagnostics.length === 0) {
    return;
  }

  const errors = diagnostics.filter((d) => d.type === 'error');
  const warnings = diagnostics.filter((d) => d.type === 'warning');
  const info = diagnostics.filter((d) => d.type === 'info');

  console.log('\n' + '='.repeat(80));
  console.log('📋 PULSAR TRANSFORMER - DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80));

  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} ERROR(S):`);
    errors.forEach((err, i) => {
      const location = err.line ? ` (line ${err.line}${err.column ? `:${err.column}` : ''})` : '';
      console.error(`  ${i + 1}. [${err.phase}]${location}`);
      console.error(`     ${err.message}`);
    });
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} WARNING(S):`);
    warnings.forEach((warn, i) => {
      const location = warn.line
        ? ` (line ${warn.line}${warn.column ? `:${warn.column}` : ''})`
        : '';
      console.warn(`  ${i + 1}. [${warn.phase}]${location}`);
      console.warn(`     ${warn.message}`);
    });
  }

  if (info.length > 0) {
    console.info(`\nℹ️  ${info.length} INFO MESSAGE(S)`);
  }

  console.log('='.repeat(80) + '\n');
}

export interface IDiagnostic {
  type: 'error' | 'warning' | 'info';
  phase: string;
  message: string;
  line?: number;
  column?: number;
}

export interface IPipelineMetrics {
  preprocessorTime: number;
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

      // 🔍 Start unified transformation session
      const unifiedTracker = getUnifiedTracker();
      const sessionId = unifiedTracker.startSession(options.filePath || 'unknown', source.length);
      logger.debug('pipeline', `Started transform session: ${sessionId}`);

      const startTime = performance.now();
      const diagnostics: IDiagnostic[] = [];

      try {
        // Phase 0: Character Encoding Preprocessing
        logger.group('🔧 Phase 0: Preprocessing');
        logger.time('Preprocessor');
        const preprocessorStartTime = performance.now();

        logger.debug('preprocessor', `Original content: ${source.length} characters`);
        const preprocessResult = preprocessCharacterEncoding(source);
        const preprocessorTime = performance.now() - preprocessorStartTime;

        logger.timeEnd('Preprocessor');
        logger.info(
          'preprocessor',
          `✅ Preprocessed content: ${preprocessResult.content.length} characters` +
            (preprocessResult.hadBOM ? ' (BOM removed)' : '') +
            (preprocessResult.invisibleCharsRemoved > 0
              ? ` (${preprocessResult.invisibleCharsRemoved} invisible chars removed)`
              : '')
        );

        // Add encoding issues to diagnostics
        if (preprocessResult.issues.length > 0) {
          logger.warn(
            'preprocessor',
            `⚠️ Found ${preprocessResult.issues.length} character encoding issues`
          );

          // Add issues as warnings to diagnostics
          preprocessResult.issues.forEach((issue) => {
            diagnostics.push({
              type: 'warning',
              phase: 'preprocessor',
              message: issue.description + ' - ' + issue.suggestion,
              line: issue.line,
              column: issue.column,
            });
          });

          // Print encoding issues summary
          const issuesSummary = formatEncodingIssues(preprocessResult.issues);
          if (issuesSummary) {
            console.warn(issuesSummary);
          }
        }

        logger.groupEnd();

        // Use preprocessed content for rest of pipeline
        const processedSource = preprocessResult.content;

        // Phase 1: Lexer
        logger.group('📝 Phase 1: Lexer');
        logger.time('Lexer');
        const lexerStartTime = performance.now();
        const lexer = createLexer(processedSource, options.filePath);
        const tokens = lexer.scanTokens();
        const lexerTime = performance.now() - lexerStartTime;
        logger.timeEnd('Lexer');
        logger.info('lexer', `✅ Generated ${tokens.length} tokens`);
        logger.trace('lexer', 'Token stream', tokens.slice(0, 10));

        // Validate lexer output
        if (tokens.length === 0) {
          logger.error('lexer', '❌ Lexer produced zero tokens');
          throw new Error('Lexer produced empty token stream');
        }

        logger.groupEnd();

        // Phase 2: Parser
        logger.group('🌳 Phase 2: Parser');
        logger.time('Parser');
        unifiedTracker.startPhase('parser', tokens.length);
        const parserStartTime = performance.now();
        const parser = createParser(tokens, options.filePath);
        const ast = parser.parse();
        const parserTime = performance.now() - parserStartTime;
        unifiedTracker.endPhase('parser', ast.body.length, true);
        logger.timeEnd('Parser');
        logger.info('parser', `✅ Generated AST with ${ast.body.length} statements`);
        logger.trace(
          'parser',
          'AST structure',
          ast.body.map((s: any) => s.type)
        );

        // Validate AST structure
        if (!ast || !ast.body) {
          logger.error('parser', '❌ Parser returned invalid AST (missing body)');
          throw new Error('Parser returned invalid AST structure');
        }
        if (ast.body.length === 0) {
          logger.warn('parser', '⚠️ Parser returned empty AST body');
        }

        // Track AST node types
        const nodeTypes = ast.body.map((s: any) => s.type);
        const hasExports = nodeTypes.some(
          (t: string) => t === 'ExportNamedDeclaration' || t === 'ExportDefaultDeclaration'
        );
        const hasComponents = nodeTypes.some((t: string) => t === 'ComponentDeclaration');
        logger.debug(
          'parser',
          `AST contains: ${hasExports ? 'exports' : 'no exports'}, ${hasComponents ? 'components' : 'no components'}`
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

        // DEBUG: Inspect code string for dollar signs
        console.log('[PIPELINE-CODEGEN] Code length:', code.length);
        console.log('[PIPELINE-CODEGEN] Code contains ForRegistry:', code.includes('ForRegistry'));
        console.log('[PIPELINE-CODEGEN] Code contains item.price:', code.includes('item.price'));
        const dollarMatches = code.match(/\['[^\]]*item\.price/g);
        console.log('[PIPELINE-CODEGEN] Dollar sign patterns:', dollarMatches);

        // DEBUG: Check for product.price template literal
        if (code.includes('product.price')) {
          const match = code.match(/`[^`]*product\.price[^`]*`/);
          if (match) {
            console.log('[PIPELINE-DEBUG] Code from generator:', match[0]);
            console.log(
              '[PIPELINE-DEBUG] Char codes:',
              Array.from(match[0]).map((c) => c.charCodeAt(0))
            );
          }
        }

        const transformTime = performance.now() - transformStartTime;
        logger.timeEnd('CodeGenerator');
        logger.info('codegen', `✅ Generated ${code.length} characters`);
        logger.trace('codegen', 'First 200 chars', code.slice(0, 200));

        // Validate code generation output
        if (!code || code.length === 0) {
          logger.error('codegen', '❌ CodeGenerator produced empty output');
          throw new Error('CodeGenerator produced empty string');
        }

        // Check for header-only output (incomplete transformation)
        const hasHeader = code.includes('/* Pulsar v') && code.includes(' PSR */');
        if (hasHeader && code.length < 500) {
          logger.error('codegen', `❌ CodeGenerator produced only header (${code.length} bytes)`);
          logger.trace('codegen', 'Full output', code);
        }

        logger.groupEnd();

        // DEBUG: Write code to file BEFORE validation
        if (code.length > 1000) {
          try {
            const fs = await import('fs');
            fs.writeFileSync('./pre-validation-code.js', code, 'utf8');
            logger.debug('pipeline', '📝 Wrote generated code to pre-validation-code.js');
          } catch (e) {
            logger.error('pipeline', 'Failed to write debug file:', e);
          }
        }

        // Phase 5: Output Validation
        logger.group('✓ Phase 5: Output Validation');
        logger.time('Validation');
        const validationResult = validateTransformationOutput(
          source,
          code,
          options.filePath || 'unknown'
        );
        logger.timeEnd('Validation');

        // Log validation results
        if (!validationResult.valid) {
          logger.error(
            'validation',
            `❌ Validation failed with ${validationResult.errors.length} errors`
          );
          validationResult.errors.forEach((err) => {
            logger.error('validation', `  - [${err.type}] ${err.message}`);
            diagnostics.push({
              type: 'error',
              phase: 'Validation',
              message: err.message,
              line: err.line,
              column: err.column,
            });
          });

          // CRITICAL: Stop transformation on validation errors
          logger.groupEnd();
          return {
            code: '',
            diagnostics,
          };
        } else {
          logger.info('validation', '✅ Output validation passed');
        }

        if (validationResult.warnings.length > 0) {
          logger.warn('validation', `⚠️ ${validationResult.warnings.length} validation warnings`);
          validationResult.warnings.forEach((warn) => {
            logger.warn('validation', `  - [${warn.type}] ${warn.message}`);
            if (warn.suggestion) {
              logger.debug('validation', `    Suggestion: ${warn.suggestion}`);
            }
            diagnostics.push({
              type: 'warning',
              phase: 'Validation',
              message: warn.message,
              line: warn.line,
              column: warn.column,
            });
          });
        }

        logger.groupEnd();

        const totalTime = performance.now() - startTime;

        // 🔍 End unified transformation session
        const session = unifiedTracker.endSession();

        logger.info('pipeline', `✨ Transformation complete in ${totalTime.toFixed(2)}ms`);
        logger.debug('pipeline', 'Performance breakdown:', {
          lexer: `${lexerTime.toFixed(2)}ms`,
          parser: `${parserTime.toFixed(2)}ms`,
          codegen: `${transformTime.toFixed(2)}ms`,
          total: `${totalTime.toFixed(2)}ms`,
        });

        // Show unified tracking report if debug enabled
        if (options.debug) {
          console.log('\n' + unifiedTracker.getReport());
        }

        // ALWAYS print diagnostic summary (not behind debug flag)
        printDiagnosticSummary(diagnostics);

        // Also log to debug logger if enabled
        if (diagnostics.length > 0) {
          logger.group('📋 Diagnostic Summary');
          const errors = diagnostics.filter((d) => d.type === 'error');
          const warnings = diagnostics.filter((d) => d.type === 'warning');
          const info = diagnostics.filter((d) => d.type === 'info');

          if (errors.length > 0) {
            logger.error('pipeline', `❌ ${errors.length} Error(s):`);
            errors.forEach((err, i) => {
              const location = err.line ? ` at line ${err.line}` : '';
              logger.error('pipeline', `  ${i + 1}. [${err.phase}]${location} ${err.message}`);
            });
          }

          if (warnings.length > 0) {
            logger.warn('pipeline', `⚠️  ${warnings.length} Warning(s):`);
            warnings.forEach((warn, i) => {
              const location = warn.line ? ` at line ${warn.line}` : '';
              logger.warn('pipeline', `  ${i + 1}. [${warn.phase}]${location} ${warn.message}`);
            });
          }

          if (info.length > 0) {
            logger.info('pipeline', `ℹ️  ${info.length} Info message(s)`);
          }

          logger.groupEnd();
        } else {
          logger.info('pipeline', '✅ No diagnostics - transformation clean');
        }

        // DEBUG: Check code before return
        if (code.includes('product.price')) {
          const match = code.match(/`[^`]*product\.price[^`]*`/);
          if (match) {
            console.log('[PIPELINE-DEBUG] Code before return:', match[0]);
            console.log(
              '[PIPELINE-DEBUG] Char codes:',
              Array.from(match[0]).map((c) => c.charCodeAt(0))
            );
          }
        }

        return {
          code,
          diagnostics,
          metrics: {
            preprocessorTime,
            lexerTime,
            parserTime,
            transformTime,
            totalTime,
          },
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';

        // 🔍 Record error in unified tracker
        if (unifiedTracker.currentSession) {
          unifiedTracker.recordError('pipeline', 'transform', error as Error);

          // End session with error
          try {
            const session = unifiedTracker.endSession();
            if (options.debug) {
              console.log('\n' + unifiedTracker.getReport());
            }
          } catch (sessionError) {
            console.warn('[UNIFIED-TRACKER] Failed to end session:', sessionError);
          }
        }

        logger.error('pipeline', '❌ Transformation failed', {
          error: errorMsg,
          stack: errorStack,
        });
        diagnostics.push({
          type: 'error',
          phase: 'Pipeline',
          message: errorMsg,
        });

        // ALWAYS print diagnostic summary (not behind debug flag)
        printDiagnosticSummary(diagnostics);

        // Also show in debug logger if enabled
        if (diagnostics.length > 0) {
          logger.group('📋 Diagnostic Summary');
          const errors = diagnostics.filter((d) => d.type === 'error');
          const warnings = diagnostics.filter((d) => d.type === 'warning');
          const info = diagnostics.filter((d) => d.type === 'info');

          if (errors.length > 0) {
            logger.error('pipeline', `❌ ${errors.length} Error(s):`);
            errors.forEach((err, i) => {
              const location = err.line ? ` at line ${err.line}` : '';
              logger.error('pipeline', `  ${i + 1}. [${err.phase}]${location} ${err.message}`);
            });
          }

          if (warnings.length > 0) {
            logger.warn('pipeline', `⚠️  ${warnings.length} Warning(s):`);
            warnings.forEach((warn, i) => {
              const location = warn.line ? ` at line ${warn.line}` : '';
              logger.warn('pipeline', `  ${i + 1}. [${warn.phase}]${location} ${warn.message}`);
            });
          }

          if (info.length > 0) {
            logger.info('pipeline', `ℹ️  ${info.length} Info message(s)`);
          }

          logger.groupEnd();
        }

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
export {
  detectBOM,
  detectInvisibleCharacters,
  formatEncodingIssues,
  normalizeUnicode,
  preprocessCharacterEncoding,
  removeInvisibleCharacters,
  stripBOM,
  type ICharacterEncodingIssue,
  type IPreprocessorResult,
} from './preprocessor/character-encoding.js';
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
