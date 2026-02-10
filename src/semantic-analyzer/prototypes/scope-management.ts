/**
 * Symbol table management - scope operations
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';
import type { IScope, ScopeType } from '../semantic-analyzer.types.js';

/**
 * Enter a new scope
 */
export function enterScope(this: ISemanticAnalyzer, type: ScopeType): IScope {
  this.scopeCounter++;
  const scopeId = `scope-${this.scopeCounter}`;

  const newScope: IScope = {
    id: scopeId,
    type,
    parent: this.symbolTable.currentScope,
    symbols: new Map(),
    children: [],
  };

  // Add to parent's children
  if (this.symbolTable.currentScope) {
    this.symbolTable.currentScope.children.push(newScope);
  }

  // Register scope
  this.symbolTable.scopes.set(scopeId, newScope);
  this.symbolTable.currentScope = newScope;

  return newScope;
}

/**
 * Exit current scope, return to parent
 */
export function exitScope(this: ISemanticAnalyzer): void {
  if (this.symbolTable.currentScope.parent) {
    this.symbolTable.currentScope = this.symbolTable.currentScope.parent;
  }
}
