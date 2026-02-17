/**
 * Symbol table management - symbol operations
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';
import type { ISymbol, SymbolKind } from '../semantic-analyzer.types.js';

/**
 * Declare a symbol in current scope
 */
export function declareSymbol(
  this: ISemanticAnalyzer,
  name: string,
  kind: SymbolKind,
  type: string | null,
  node: any
): ISymbol {
  const currentScope = this.symbolTable.currentScope;

  // Check for duplicate in current scope
  if (currentScope.symbols.has(name)) {
    this.addError('duplicate-declaration', `Duplicate declaration of '${name}'`, node);
  }

  const symbol: ISymbol = {
    name,
    kind,
    type,
    node,
    scopeId: currentScope.id,
    isUsed: false,
    isExported: false,
  };

  // Add to current scope
  currentScope.symbols.set(name, symbol);

  // Add to global symbol table
  this.symbolTable.symbols.set(`${currentScope.id}:${name}`, symbol);

  return symbol;
}

/**
 * Resolve a symbol - search current scope and parent scopes
 */
export function resolveSymbol(this: ISemanticAnalyzer, name: string): ISymbol | null {
  let scope = this.symbolTable.currentScope;

  while (scope) {
    if (scope.symbols.has(name)) {
      return scope.symbols.get(name)!;
    }
    const parentScope = scope.parent;
    if (!parentScope) {
      break;
    }
    scope = parentScope;
  }

  return null;
}

/**
 * Mark a symbol as used
 */
export function markSymbolUsed(this: ISemanticAnalyzer, name: string): void {
  const symbol = this.resolveSymbol(name);
  if (symbol) {
    symbol.isUsed = true;
  }
}

