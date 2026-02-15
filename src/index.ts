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

import { transformWithBabelPipeline } from './babel-pipeline.js';
import {
  formatEncodingIssues,
  preprocessCharacterEncoding,
} from './preprocessor/character-encoding.js';

// Initialize tracing (auto-instruments pipeline if PULSAR_TRACE=1)
import './init-tracing.js';

import {
  type IDiagnostic,
  type IPipelineMetrics,
  type IPipelineOptions,
  type IPipelineResult,
} from './types.js';

export { IDiagnostic, IPipelineMetrics, IPipelineOptions, IPipelineResult };

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

/**
 * Create transformation pipeline (Babel-based)
 */
export function createPipeline(options: IPipelineOptions = {}) {
  return {
    transform: async (source: string): Promise<IPipelineResult> => {
      if (options.debug) {
        console.log('🚀 Starting Babel-based PSR transformation');
        console.log(`Input: ${source.length} characters`);
      }

      const diagnostics: IDiagnostic[] = [];

      try {
        // Phase 0: Character Encoding Preprocessing
        if (options.debug) {
          console.log('\n🔧 Phase 0: Character Encoding Preprocessing');
        }

        const preprocessResult = preprocessCharacterEncoding(source);

        // Add encoding issues to diagnostics
        if (preprocessResult.issues.length > 0) {
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

        const processedSource = preprocessResult.content;

        // Phase 1-4: Babel Pipeline (Parse → Transform → Generate)
        if (options.debug) {
          console.log('\n📝 Phase 1-4: Babel Pipeline');
        }

        const result = await transformWithBabelPipeline(processedSource, options);

        // Merge preprocessing diagnostics
        result.diagnostics = [...diagnostics, ...result.diagnostics];

        // Print diagnostic summary
        printDiagnosticSummary(result.diagnostics);

        if (options.debug) {
          console.log('✅ Transformation complete');
          console.log(`Total time: ${result.metrics?.totalTime.toFixed(2)}ms`);
        }

        return result;
      } catch (error: any) {
        diagnostics.push({
          type: 'error',
          phase: 'pipeline',
          message: error.message || 'Unknown pipeline error',
          line: 0,
          column: 0,
        });

        printDiagnosticSummary(diagnostics);

        return {
          code: '',
          diagnostics,
          metrics: {
            preprocessorTime: 0,
            lexerTime: 0,
            parserTime: 0,
            transformTime: 0,
            totalTime: 0,
          },
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
