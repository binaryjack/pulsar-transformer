/**
 * Analyzer Type Definitions
 */

import type { IASTNode } from '../parser/ast/index.js';
import type {
  IBinaryExpressionIR,
  IConditionalExpressionIR,
  IIdentifierIR,
  IIRNode,
  IMemberExpressionIR,
  IUnaryExpressionIR,
} from './ir/index.js';

/**
 * Analyzer Interface
 */
export interface IAnalyzer {
  /**
   * Analyze AST and build IR
   */
  analyze(ast: IASTNode): IIRNode;

  /**
   * Get analysis context
   */
  getContext(): IAnalyzerContext;

  /**
   * Check for analysis errors
   */
  hasErrors(): boolean;

  /**
   * Get analysis errors
   */
  getErrors(): readonly IAnalyzerError[];
}

/**
 * Internal Analyzer Interface
 */
export interface IAnalyzerInternal extends IAnalyzer {
  _context: IAnalyzerContext;
  _errors: IAnalyzerError[];
  _config: IAnalyzerConfig;

  // Private analysis methods
  _analyzeNode(node: IASTNode): IIRNode;
  _analyzeComponent(node: any): IIRNode;
  _analyzeElement(node: any): IIRNode;
  _analyzeComponentReference(node: any): IIRNode;
  _analyzeSignalBinding(node: any): IIRNode;
  _analyzeExpression(node: any): IIRNode;
  _analyzeVariable(node: any): IIRNode;
  _analyzeReturn(node: any): IIRNode;
  _analyzeIfStatement(node: any): IIRNode;
  _analyzeImport(node: any): IIRNode;
  _analyzeExport(node: any): IIRNode;

  // Helper methods
  _addError(error: IAnalyzerError): void;
  _enterScope(name: string): void;
  _exitScope(): void;
  _registerSignal(name: string): void;
  _isSignal(name: string): boolean;

  // Expression analysis helpers
  _analyzeLiteral(node: any): IIRNode;
  _analyzeTemplateLiteral(node: any): IIRNode;
  _analyzeIdentifier(node: any): IIdentifierIR;
  _analyzeCallExpression(node: any): IIRNode;
  _analyzeArrowFunction(node: any): IIRNode;
  _analyzeBinaryExpression(node: any): IBinaryExpressionIR;
  _analyzeUnaryExpression(node: any): IUnaryExpressionIR;
  _analyzeMemberExpression(node: any): IMemberExpressionIR;
  _analyzeConditionalExpression(node: any): IConditionalExpressionIR;

  // Component/element analysis helpers
  _detectEventHandlers(node: any): any[];
  _isPureComponent(body: any[]): boolean;
  _handlerAccessesSignals(handler: IIRNode): boolean;

  // Scope helpers
  _isParameter(name: string): boolean;
  _isInCurrentScope(name: string): boolean;
  _isFunctionPure(body: any): boolean;
}

/**
 * Analyzer Configuration
 */
export interface IAnalyzerConfig {
  /**
   * Collect errors instead of throwing
   */
  collectErrors?: boolean;

  /**
   * Maximum errors before stopping
   */
  maxErrors?: number;

  /**
   * Enable optimization analysis
   */
  enableOptimizations?: boolean;

  /**
   * Track dependencies
   */
  trackDependencies?: boolean;
}

/**
 * Analyzer Context (state during analysis)
 */
export interface IAnalyzerContext {
  /**
   * Current scope stack
   */
  scopes: IScope[];

  /**
   * Current component being analyzed
   */
  currentComponent: string | null;

  /**
   * Declared signals in current scope
   */
  signals: Set<string>;

  /**
   * Imported identifiers
   */
  imports: Map<string, string>;

  /**
   * Exported identifiers
   */
  exports: Set<string>;

  /**
   * Registry keys generated
   */
  registryKeys: Map<string, string>;
}

/**
 * Scope Information
 */
export interface IScope {
  name: string;
  type: 'component' | 'function' | 'block';
  variables: Map<string, IScopeVariable>;
  parent: IScope | null;
}

/**
 * Scope Variable Information
 */
export interface IScopeVariable {
  name: string;
  kind: 'const' | 'let' | 'parameter';
  isSignal: boolean;
  declarationNode: any;
}

/**
 * Analyzer Error
 */
export interface IAnalyzerError {
  code: string;
  message: string;
  location?: {
    line: number;
    column: number;
  };
  severity: 'error' | 'warning' | 'info';
  context?: string;
}
