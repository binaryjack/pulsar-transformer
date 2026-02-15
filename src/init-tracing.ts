/**
 * Tracer integration - Apply tracing to pipeline functions
 * This module instruments the transformer pipeline with tracing decorators
 */

import { wrapTracedMethod } from './debug/tracer/index.js';
import { Lexer } from './lexer/index.js';
import { Parser } from './parser/index.js';

/**
 * Initialize tracing on pipeline components
 * Called automatically on module load, wraps methods with traced decorators
 */
export function initializeTracing(): void {
  // Lexer tracing
  wrapTracedMethod(Lexer.prototype, 'scanTokens', 'lexer');
  wrapTracedMethod(Lexer.prototype, 'scanToken', 'lexer');
  wrapTracedMethod(Lexer.prototype, 'scanIdentifier', 'lexer');
  wrapTracedMethod(Lexer.prototype, 'scanNumber', 'lexer');
  wrapTracedMethod(Lexer.prototype, 'scanString', 'lexer');

  // Parser tracing
  wrapTracedMethod(Parser.prototype, 'parse', 'parser');
  wrapTracedMethod(Parser.prototype, 'parseProgram', 'parser');
  wrapTracedMethod(Parser.prototype, 'parseStatement', 'parser');
  wrapTracedMethod(Parser.prototype, 'parseExpression', 'parser');
  wrapTracedMethod(Parser.prototype, 'parseComponentDeclaration', 'parser');
  wrapTracedMethod(Parser.prototype, 'parseJSXElement', 'parser');
  wrapTracedMethod(Parser.prototype, 'parseVariableDeclaration', 'parser');

  // ✅ MISSING: Transformer tracing
  instrumentTransformer();

  // ✅ MISSING: Code Generator tracing
  instrumentCodeGenerator();

  // ✅ MISSING: Semantic Analyzer tracing
  instrumentSemanticAnalyzer();
}

/**
 * Instrument transformer methods with tracing
 */
async function instrumentTransformer(): Promise<void> {
  try {
    const { TransformerPrototype } = await import('./transformer/transformer.js');

    // Core transformation methods
    wrapTracedMethod(TransformerPrototype, 'transform', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformProgram', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformStatement', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformExpression', 'transformer');

    // Component transformation (critical)
    wrapTracedMethod(TransformerPrototype, 'transformComponentDeclaration', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformJSXElement', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformCallExpression', 'transformer');

    // Other transformations
    wrapTracedMethod(TransformerPrototype, 'transformFunctionDeclaration', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformVariableDeclaration', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformInterfaceDeclaration', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformExportNamedDeclaration', 'transformer');
    wrapTracedMethod(TransformerPrototype, 'transformBlockStatement', 'transformer');

    console.log('[TRACER] Transformer instrumentation complete');
  } catch (error) {
    console.warn('[TRACER] Failed to instrument transformer:', (error as Error).message);
  }
}

/**
 * Instrument code generator methods with tracing
 */
async function instrumentCodeGenerator(): Promise<void> {
  try {
    const { CodeGenerator } = await import('./code-generator/code-generator.js');

    // Core generation methods
    wrapTracedMethod((CodeGenerator as any).prototype, 'generate', 'codegen');
    wrapTracedMethod((CodeGenerator as any).prototype, 'generateProgram', 'codegen');
    wrapTracedMethod((CodeGenerator as any).prototype, 'generateStatement', 'codegen');
    wrapTracedMethod((CodeGenerator as any).prototype, 'generateExpression', 'codegen');

    // JSX and reactive generation (critical)
    wrapTracedMethod((CodeGenerator as any).prototype, 'generateJSXElement', 'codegen');
    wrapTracedMethod((CodeGenerator as any).prototype, 'isReactiveExpression', 'codegen');

    // Import and type management
    wrapTracedMethod((CodeGenerator as any).prototype, 'generateImports', 'codegen');
    wrapTracedMethod((CodeGenerator as any).prototype, 'generateTypeAnnotation', 'codegen');
    wrapTracedMethod((CodeGenerator as any).prototype, 'addImport', 'codegen');

    console.log('[TRACER] Code generator instrumentation complete');
  } catch (error) {
    console.warn('[TRACER] Failed to instrument code generator:', (error as Error).message);
  }
}

/**
 * Instrument semantic analyzer methods with tracing
 */
async function instrumentSemanticAnalyzer(): Promise<void> {
  try {
    const { SemanticAnalyzerPrototype } = await import('./semantic-analyzer/semantic-analyzer.js');

    // Core analysis methods
    wrapTracedMethod(SemanticAnalyzerPrototype, 'analyze', 'semantic');
    wrapTracedMethod(SemanticAnalyzerPrototype, 'analyzeProgram', 'semantic');
    wrapTracedMethod(SemanticAnalyzerPrototype, 'analyzeStatement', 'semantic');
    wrapTracedMethod(SemanticAnalyzerPrototype, 'analyzeExpression', 'semantic');

    // Component analysis (critical)
    wrapTracedMethod(SemanticAnalyzerPrototype, 'analyzeComponentDeclaration', 'semantic');
    wrapTracedMethod(SemanticAnalyzerPrototype, 'analyzeJSXElement', 'semantic');
    wrapTracedMethod(SemanticAnalyzerPrototype, 'analyzeCallExpression', 'semantic');

    // Reactivity analysis
    wrapTracedMethod(SemanticAnalyzerPrototype, 'validateReactivity', 'semantic');
    wrapTracedMethod(SemanticAnalyzerPrototype, 'checkSignalDependencies', 'semantic');
    wrapTracedMethod(SemanticAnalyzerPrototype, 'checkEffectDependencies', 'semantic');

    console.log('[TRACER] Semantic analyzer instrumentation complete');
  } catch (error) {
    console.warn('[TRACER] Failed to instrument semantic analyzer:', (error as Error).message);
  }
}

// Auto-initialize on module load
console.log('[TRACER INIT] Environment vars:');
console.log('  PULSAR_TRACE:', process.env.PULSAR_TRACE);
console.log('  PULSAR_TRACE_HTTP:', process.env.PULSAR_TRACE_HTTP);
console.log('  PULSAR_TRACE_CHANNELS:', process.env.PULSAR_TRACE_CHANNELS);
initializeTracing();
console.log('[TRACER INIT] Tracing initialized');
