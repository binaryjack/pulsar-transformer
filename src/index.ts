/**
 * Pulsar Transformer - Main Package Exports
 *
 * Modern PSR (Pulsar Syntax Representation) transformer
 * Architecture: Lexer → Parser → Analyzer → Transform → Emit
 */

// ===== CORE PIPELINE =====

// Lexer exports
export { TokenType, createLexer } from './parser/lexer/index.js';
export type { ILexer, ILexerConfig, IToken } from './parser/lexer/index.js';

// Parser exports
export { createParser } from './parser/create-parser.js';
export type { IParser, IParserConfig } from './parser/parser.types.js';

// AST exports
export type {
  ASTNodeType,
  IASTNode,
  IArrowFunctionNode,
  ICallExpressionNode,
  IComponentDeclarationNode,
  IExpressionStatementNode,
  IIdentifierNode,
  ILiteralNode,
  IPSRAttributeNode,
  IPSRElementNode,
  IPSREventHandlerNode,
  IPSRSignalBindingNode,
  IProgramNode,
  IReturnStatementNode,
  IVariableDeclarationNode,
} from './parser/ast/ast-node-types.js';

// Analyzer exports (IR Builder)
export type { IAnalyzer, IAnalyzerConfig, IAnalyzerContext } from './analyzer/analyzer.types.js';
export { createAnalyzer } from './analyzer/create-analyzer.js';

// IR exports
export type {
  IArrowFunctionIR,
  ICallExpressionIR,
  IComponentIR,
  IElementIR,
  IEventHandlerIR,
  IIRMetadata,
  IIRNode,
  IIdentifierIR,
  ILiteralIR,
  IRNodeType,
  IRegistryLookupIR,
  IRegistryRegistrationIR,
  IReturnStatementIR,
  ISignalBindingIR,
  IVariableDeclarationIR,
} from './analyzer/ir/ir-node-types.js';

// Transform exports (Strategy System)
export { createComponentTransformStrategy } from './transformer/transform/strategies/create-component-transform-strategy.js';
export { createTransformStrategyManager } from './transformer/transform/strategy-manager/index.js';
export type {
  IComponentTransformStrategy,
  IElementTransformStrategy,
  IEventTransformStrategy,
  ISignalTransformStrategy,
  ITransformContext,
  ITransformResult,
  ITransformStrategy,
  ITransformStrategyManager,
} from './transformer/transform/transform-strategy.types.js';

// Emitter exports (Code Generation)
export { createEmitter } from './emitter/create-emitter.js';
export { createImportTracker } from './emitter/create-import-tracker.js';
export type {
  IEmitContext,
  IEmitter,
  IEmitterConfig,
  IImportTracker,
} from './emitter/emitter.types.js';

// Pipeline exports (Full Transformation)
export { createPipeline } from './pipeline/create-pipeline.js';
export type {
  IPipeline,
  IPipelineConfig,
  IPipelineDiagnostic,
  IPipelineMetrics,
  IPipelineResult,
} from './pipeline/pipeline.types.js';

// ===== UTILITIES =====

// Debug Logger
export { createDebugLogger } from './debug/create-debug-logger.js';
export type {
  DebugChannel,
  DebugLevel,
  IDebugLogEntry,
  IDebugLogger,
  IDebugLoggerConfig,
} from './debug/debug-logger.types.js';

// Validator
export { createValidator } from './validator/create-validator.js';
export {
  validateImports,
  validateJsxTransformed,
  validateSignalsWired,
} from './validator/rules/index.js';
export type {
  IValidationContext,
  IValidationIssue,
  IValidationResult,
  IValidationRule,
  IValidator,
  IValidatorConfig,
  ValidationIssueType,
  ValidationSeverity,
} from './validator/validator.types.js';

// Error handling
export { TransformerError } from './error/transformer-error.js';

// AST utilities
export { getASTPath, getNodePosition, getNodeSnippet, getNodeTypeName } from './utils/ast-utils.js';

// Import injection (legacy - will be replaced by emitter)
export { addPulsarImports } from './utils/import-injector.js';

/**
 * Version information
 */
export const VERSION = '1.0.0-alpha.1';

/**
 * Pipeline status
 */
export const PIPELINE_STATUS = {
  lexer: 'complete', // 14/14 tests ✅
  parser: 'complete', // 23/23 tests ✅
  analyzer: 'complete', // 22/22 tests ✅
  transform: 'complete', // 19/19 tests ✅
  emitter: 'complete', // 25/25 tests ✅
  pipeline: 'complete', // Integration implemented ✅
  debug: 'complete', // Debug logger implemented ✅
  validator: 'complete', // Output validator implemented ✅
  guards: 'pending', // Not started
} as const;
