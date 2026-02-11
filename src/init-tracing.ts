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
}

// Auto-initialize on module load
console.log('[TRACER INIT] Environment vars:');
console.log('  PULSAR_TRACE:', process.env.PULSAR_TRACE);
console.log('  PULSAR_TRACE_HTTP:', process.env.PULSAR_TRACE_HTTP);
console.log('  PULSAR_TRACE_CHANNELS:', process.env.PULSAR_TRACE_CHANNELS);
initializeTracing();
console.log('[TRACER INIT] Tracing initialized');
