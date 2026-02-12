/**
 * Semantic Analyzer - Validates AST and builds symbol tables
 * Pattern: Prototype-based class
 */

import type { IProgramNode } from '../parser/parser.types.js';
import type {
  IScope,
  ISemanticAnalysisResult,
  ISemanticError,
  ISymbol,
  ISymbolTable,
} from './semantic-analyzer.types.js';

/**
 * Semantic Analyzer interface (prototype-based class)
 */
export interface ISemanticAnalyzer {
  new (ast: IProgramNode, filePath?: string): ISemanticAnalyzer;

  // State
  ast: IProgramNode;
  filePath: string;
  symbolTable: ISymbolTable;
  errors: ISemanticError[];
  warnings: ISemanticError[];
  scopeCounter: number;

  // Core methods
  analyze(): ISemanticAnalysisResult;

  // Symbol table management
  enterScope(type: 'global' | 'function' | 'block' | 'component'): IScope;
  exitScope(): void;
  declareSymbol(name: string, kind: string, type: string | null, node: any): ISymbol;
  resolveSymbol(name: string): ISymbol | null;
  markSymbolUsed(name: string): void;

  // Validation methods
  analyzeProgram(node: IProgramNode): void;
  analyzeStatement(node: any): void;
  analyzeComponentDeclaration(node: any): void;
  analyzeFunctionDeclaration(node: any): void;
  analyzeVariableDeclaration(node: any): void;
  analyzeInterfaceDeclaration(node: any): void;
  analyzeExpression(node: any): void;
  analyzeBlockStatement(node: any): void;
  analyzeIfStatement(node: any): void;
  analyzeReturnStatement(node: any): void;
  analyzeCallExpression(node: any): void;
  analyzeJSXElement(node: any): void;

  // Type checking
  checkType(node: any, expectedType: string | null): boolean;
  inferType(node: any): string | null;

  // Reactivity validation
  validateReactivity(node: any): void;
  checkSignalDependencies(node: any): void;
  checkEffectDependencies(node: any): void;
  extractCapturedVariables(node: any): string[];
  extractDependencies(node: any): string[];
  walkNode(node: any, callback: (node: any) => void): void;

  // Error reporting
  addError(type: string, message: string, node: any): void;
  addWarning(type: string, message: string, node: any): void;

  // Post-analysis checks
  checkUnusedSymbols(): void;
  checkDeadCode(): void;
}

/**
 * SemanticAnalyzer constructor
 */
export const SemanticAnalyzer: ISemanticAnalyzer = function (
  this: ISemanticAnalyzer,
  ast: IProgramNode,
  filePath = 'unknown'
) {
  this.ast = ast;
  this.filePath = filePath;
  this.errors = [];
  this.warnings = [];
  this.scopeCounter = 0;

  // Initialize symbol table with global scope
  const globalScope: IScope = {
    id: 'scope-0',
    type: 'global',
    parent: null,
    symbols: new Map(),
    children: [],
  };

  this.symbolTable = {
    globalScope,
    currentScope: globalScope,
    scopes: new Map([['scope-0', globalScope]]),
    symbols: new Map(),
  };
} as any;

// Export prototype for method registration
export const SemanticAnalyzerPrototype = SemanticAnalyzer.prototype;
