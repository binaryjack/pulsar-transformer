/**
 * Semantic Analyzer Type Definitions
 * Defines symbol tables, scopes, and semantic error types
 */

import type { IASTNode } from '../parser/parser.types.js';

/**
 * Symbol Table Entry - represents a declared identifier
 */
export interface ISymbol {
  name: string;
  kind: SymbolKind;
  type: string | null;
  node: IASTNode;
  scopeId: string;
  isUsed: boolean;
  isExported: boolean;
}

/**
 * Symbol kinds
 */
export type SymbolKind =
  | 'component'
  | 'function'
  | 'variable'
  | 'parameter'
  | 'interface'
  | 'type'
  | 'import';

/**
 * Scope - represents a block or function scope
 */
export interface IScope {
  id: string;
  type: ScopeType;
  parent: IScope | null;
  symbols: Map<string, ISymbol>;
  children: IScope[];
}

/**
 * Scope types
 */
export type ScopeType = 'global' | 'function' | 'block' | 'component';

/**
 * Symbol Table - tracks all symbols and scopes
 */
export interface ISymbolTable {
  globalScope: IScope;
  currentScope: IScope;
  scopes: Map<string, IScope>;
  symbols: Map<string, ISymbol>;
}

/**
 * Semantic Error
 */
export interface ISemanticError {
  type: SemanticErrorType;
  message: string;
  node: IASTNode;
  line?: number;
  column?: number;
}

/**
 * Semantic error types
 */
export type SemanticErrorType =
  | 'undeclared-variable'
  | 'duplicate-declaration'
  | 'type-mismatch'
  | 'invalid-assignment'
  | 'unused-variable'
  | 'unused-import'
  | 'dead-code'
  | 'invalid-reactivity'
  | 'missing-dependency'
  | 'invalid-jsx'
  | 'invalid-component';

/**
 * Semantic Analysis Result
 */
export interface ISemanticAnalysisResult {
  symbolTable: ISymbolTable;
  errors: ISemanticError[];
  warnings: ISemanticError[];
}
