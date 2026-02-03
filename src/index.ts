/**
 * Pulsar Transformer - Main Package Exports
 *
 * Modern PSR (Pulsar Syntax Representation) transformer
 * Architecture: Lexer → Parser → Analyzer → Transform → Emit
 */

// ===== CORE PIPELINE =====

// Lexer exports
export { createLexer, TokenType } from './parser/lexer.js';
export type { ILexer, ILexerConfig, IToken } from './parser/lexer.js';

// Parser exports
export { createParser } from './parser/create-parser.js';
export type { IParser, IParserConfig } from './parser/parser.types.js';

// AST exports
export type {
  ArrowFunction,
  ASTNode,
  CallExpression,
  ComponentDeclaration,
  EventHandler,
  Identifier,
  Literal,
  PSRAttribute,
  PSRElement,
  ReturnStatement,
  SignalBinding,
  VariableDeclaration,
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
  IIdentifierIR,
  IIRMetadata,
  ILiteralIR,
  IRegistryLookupIR,
  IRegistryRegistrationIR,
  IReturnStatementIR,
  IRNode,
  IRNodeType,
  ISignalBindingIR,
  IVariableDeclarationIR,
} from './analyzer/ir/ir-node-types.js';

// Transform exports (Strategy System)
export { createComponentTransformStrategy } from './transformer/transform/strategies/create-component-transform-strategy.js';
export { createTransformStrategyManager } from './transformer/transform/strategy-manager.js';
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

// ===== UTILITIES =====

// Error handling
export { TransformerError } from './error/transformer-error.js';
export type { ErrorCode, IErrorMetadata } from './error/transformer-error.js';

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
  lexer: 'complete', // 14/14 tests
  parser: 'complete', // 23/23 tests
  analyzer: 'complete', // 22/22 tests
  transform: 'partial', // 19/19 tests (4/6 strategies)
  emitter: 'pending', // Not started
  guards: 'pending', // Not started
  debug: 'pending', // Not started
  pipeline: 'pending', // Not started
} as const;
