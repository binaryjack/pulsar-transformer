/**
 * Semantic Analyzer - Validates AST and builds symbol tables
 * Pattern: Prototype-based class
 */

import type {
  IASTNode,
  IBlockStatement,
  ICallExpression,
  IComponentDeclaration,
  IExpression,
  IFunctionDeclaration,
  IIfStatement,
  IJSXElement,
  IProgramNode,
  IReturnStatement,
  IStatementNode,
  IVariableDeclaration,
} from '../ast.types.js';
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
  declareSymbol(name: string, kind: string, type: string | null, node: IASTNode): ISymbol;
  resolveSymbol(name: string): ISymbol | null;
  markSymbolUsed(name: string): void;

  // Validation methods
  analyzeProgram(node: IProgramNode): void;
  analyzeStatement(node: IStatementNode): void;
  analyzeComponentDeclaration(node: IComponentDeclaration): void;
  analyzeFunctionDeclaration(node: IFunctionDeclaration): void;
  analyzeVariableDeclaration(node: IVariableDeclaration): void;
  analyzeInterfaceDeclaration(node: IASTNode): void;
  analyzeExpression(node: IExpression): void;
  analyzeBlockStatement(node: IBlockStatement): void;
  analyzeIfStatement(node: IIfStatement): void;
  analyzeReturnStatement(node: IReturnStatement): void;
  analyzeCallExpression(node: ICallExpression): void;
  analyzeJSXElement(node: IJSXElement): void;

  // Type checking
  checkType(node: IASTNode, expectedType: string | null): boolean;
  inferType(node: IASTNode): string | null;

  // Reactivity validation
  validateReactivity(node: IASTNode): void;
  checkSignalDependencies(node: IASTNode): void;
  checkEffectDependencies(node: IASTNode): void;
  extractCapturedVariables(node: IASTNode): string[];
  extractDependencies(node: IASTNode): string[];
  walkNode(node: IASTNode, callback: (node: IASTNode) => void): void;

  // Error reporting
  addError(type: string, message: string, node: IASTNode): void;
  addWarning(type: string, message: string, node: IASTNode): void;

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

/**
 * Analyze the AST and build symbol table
 */
SemanticAnalyzer.prototype.analyze = function (): ISemanticAnalysisResult {
  // Reset analysis state
  this.errors = [];
  this.warnings = [];

  // Analyze the program
  this.analyzeProgram(this.ast);

  // Post-analysis checks
  this.checkUnusedSymbols();

  return {
    symbolTable: this.symbolTable,
    errors: this.errors,
    warnings: this.warnings,
  };
};

/**
 * Analyze program node
 */
SemanticAnalyzer.prototype.analyzeProgram = function (node: IProgramNode): void {
  for (const statement of node.body) {
    this.analyzeStatement(statement);
  }
};

/**
 * Analyze statement nodes
 */
SemanticAnalyzer.prototype.analyzeStatement = function (node: IStatementNode): void {
  switch (node.type) {
    case 'VariableDeclaration':
      this.analyzeVariableDeclaration(node);
      break;
    case 'FunctionDeclaration':
      this.analyzeFunctionDeclaration(node);
      break;
    case 'ComponentDeclaration':
      this.analyzeComponentDeclaration(node);
      break;
    case 'InterfaceDeclaration':
      this.analyzeInterfaceDeclaration(node);
      break;
    case 'ExpressionStatement':
      if (node.expression) {
        this.analyzeExpression(node.expression);
      }
      break;
    case 'BlockStatement':
      this.analyzeBlockStatement(node);
      break;
    case 'IfStatement':
      this.analyzeIfStatement(node);
      break;
    case 'ReturnStatement':
      this.analyzeReturnStatement(node);
      break;
    default:
      // Skip other statement types for now
      break;
  }
};

/**
 * Analyze variable declaration
 */
SemanticAnalyzer.prototype.analyzeVariableDeclaration = function (
  node: IVariableDeclaration
): void {
  for (const declarator of node.declarations) {
    if (declarator.id && declarator.id.type === 'Identifier') {
      const name = declarator.id.name;
      let type: string | null = null;

      // Check for explicit type annotation
      if ((declarator.id as any).typeAnnotation) {
        type = this.extractTypeFromAnnotation((declarator.id as any).typeAnnotation);
      } else if (declarator.init) {
        // Infer type from initializer
        type = this.inferType(declarator.init);
      }

      // Declare the symbol
      this.declareSymbol(name, 'variable', type, declarator);
    }
  }
};

/**
 * Extract type string from type annotation
 */
SemanticAnalyzer.prototype.extractTypeFromAnnotation = function (typeAnnotation: any): string {
  if (!typeAnnotation || !typeAnnotation.typeAnnotation) {
    return 'unknown';
  }

  const typeNode = typeAnnotation.typeAnnotation;

  switch (typeNode.type) {
    case 'TSNumberKeyword':
      return 'number';
    case 'TSStringKeyword':
      return 'string';
    case 'TSBooleanKeyword':
      return 'boolean';
    case 'TSVoidKeyword':
      return 'void';
    case 'TSAnyKeyword':
      return 'any';
    case 'TypeReference':
      // Handle type references like 'number', 'string', 'KeyboardEvent', etc.
      if (typeNode.typeName && typeNode.typeName.name) {
        return typeNode.typeName.name;
      }
      return 'unknown';
    case 'UnionType':
      // Union types: string | number
      if (typeNode.types) {
        const types = typeNode.types.map((t: any) =>
          this.extractTypeFromAnnotation({ typeAnnotation: t })
        );
        return types.join(' | ');
      }
      return 'unknown';
    default:
      return 'unknown';
  }
};

/**
 * Infer type from expression
 */
SemanticAnalyzer.prototype.inferType = function (node: any): string | null {
  if (!node) return null;

  switch (node.type) {
    case 'Literal':
      if (typeof node.value === 'number') {
        return 'number';
      } else if (typeof node.value === 'string') {
        return 'string';
      } else if (typeof node.value === 'boolean') {
        return 'boolean';
      }
      break;
    case 'Identifier':
      // Look up the identifier in symbol table
      const symbol = this.resolveSymbol(node.name);
      return symbol?.type || null;
    case 'CallExpression':
      // For function calls, try to infer return type
      return 'unknown';
    default:
      return 'unknown';
  }

  return null;
};

/**
 * Declare a symbol in current scope
 */
SemanticAnalyzer.prototype.declareSymbol = function (
  name: string,
  kind: string,
  type: string | null,
  node: any
): ISymbol {
  const symbol: ISymbol = {
    name,
    kind: kind as any,
    type,
    node,
    scopeId: this.symbolTable.currentScope.id,
    isUsed: false,
    isExported: false,
  };

  // Add to current scope
  this.symbolTable.currentScope.symbols.set(name, symbol);

  // Add to global symbols map
  this.symbolTable.symbols.set(name, symbol);

  return symbol;
};

/**
 * Resolve symbol by name
 */
SemanticAnalyzer.prototype.resolveSymbol = function (name: string): ISymbol | null {
  return this.symbolTable.symbols.get(name) || null;
};

/**
 * Stub implementations for other required methods
 */
SemanticAnalyzer.prototype.analyzeComponentDeclaration = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.analyzeFunctionDeclaration = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.analyzeInterfaceDeclaration = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.analyzeExpression = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.analyzeBlockStatement = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.analyzeIfStatement = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.analyzeReturnStatement = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.checkUnusedSymbols = function (): void {
  // Stub
};

/**
 * Scope management methods
 */
SemanticAnalyzer.prototype.enterScope = function (
  type: 'global' | 'function' | 'block' | 'component'
): IScope {
  this.scopeCounter++;
  const newScope: IScope = {
    id: `scope-${this.scopeCounter}`,
    type,
    parent: this.symbolTable.currentScope,
    symbols: new Map(),
    children: [],
  };

  // Add to parent's children
  this.symbolTable.currentScope.children.push(newScope);

  // Add to scopes map
  this.symbolTable.scopes.set(newScope.id, newScope);

  // Set as current scope
  this.symbolTable.currentScope = newScope;

  return newScope;
};

SemanticAnalyzer.prototype.exitScope = function (): void {
  if (this.symbolTable.currentScope.parent) {
    this.symbolTable.currentScope = this.symbolTable.currentScope.parent;
  }
};

SemanticAnalyzer.prototype.markSymbolUsed = function (name: string): void {
  const symbol = this.resolveSymbol(name);
  if (symbol) {
    symbol.isUsed = true;
  }
};

/**
 * Type checking methods
 */
SemanticAnalyzer.prototype.checkType = function (node: any, expectedType: string | null): boolean {
  const actualType = this.inferType(node);
  return !expectedType || actualType === expectedType || actualType === 'any';
};

/**
 * Reactivity validation methods (stubs)
 */
SemanticAnalyzer.prototype.validateReactivity = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.checkSignalDependencies = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.checkEffectDependencies = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.extractCapturedVariables = function (): string[] {
  return [];
};

SemanticAnalyzer.prototype.extractDependencies = function (): string[] {
  return [];
};

SemanticAnalyzer.prototype.walkNode = function (node: any, callback: (node: any) => void): void {
  // Stub
};

/**
 * Error reporting methods
 */
SemanticAnalyzer.prototype.addError = function (type: string, message: string, node: any): void {
  this.errors.push({
    type: type as any,
    message,
    node,
    line: node.start?.line,
    column: node.start?.column,
  });
};

SemanticAnalyzer.prototype.addWarning = function (type: string, message: string, node: any): void {
  this.warnings.push({
    type: type as any,
    message,
    node,
    line: node.start?.line,
    column: node.start?.column,
  });
};

/**
 * Post-analysis checks
 */
SemanticAnalyzer.prototype.checkDeadCode = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.analyzeCallExpression = function (): void {
  // Stub
};

SemanticAnalyzer.prototype.analyzeJSXElement = function (): void {
  // Stub
};

// Export prototype for method registration
export const SemanticAnalyzerPrototype = SemanticAnalyzer.prototype;
