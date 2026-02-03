/**
 * Analyzer Helper Methods
 * 
 * Scope management, signal tracking, error handling.
 */

import type { IAnalyzerInternal, IAnalyzerError, IScope } from '../analyzer.types';

/**
 * Add analysis error
 */
export function addError(this: IAnalyzerInternal, error: IAnalyzerError): void {
  this._errors.push(error);
  
  // Stop if max errors reached
  const maxErrors = this._config.maxErrors || 10;
  if (this._errors.length >= maxErrors) {
    throw new Error(`Analysis stopped: ${maxErrors} errors reached`);
  }
}

/**
 * Enter a new scope
 */
export function enterScope(this: IAnalyzerInternal, name: string): void {
  const scope: IScope = {
    name,
    type: name.includes('component') ? 'component' : 'function',
    variables: new Map(),
    parent: this._context.scopes[0] || null,
  };
  
  // Push to front of stack
  this._context.scopes.unshift(scope);
}

/**
 * Exit current scope
 */
export function exitScope(this: IAnalyzerInternal): void {
  this._context.scopes.shift();
}

/**
 * Register a signal in context
 */
export function registerSignal(this: IAnalyzerInternal, name: string): void {
  this._context.signals.add(name);
}

/**
 * Check if identifier is a signal
 */
export function isSignal(this: IAnalyzerInternal, name: string): boolean {
  // Check if declared as signal in current scope
  for (const scope of this._context.scopes) {
    const variable = scope.variables.get(name);
    if (variable && variable.isSignal) {
      return true;
    }
  }
  
  // Check global signals
  return this._context.signals.has(name);
}
