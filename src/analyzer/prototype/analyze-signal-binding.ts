/**
 * Analyze Signal Binding
 *
 * Converts signal binding AST to SignalBindingIR.
 */

import type { IPSRSignalBindingNode } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { ISignalBindingIR } from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze signal binding $(signal)
 */
export function analyzeSignalBinding(
  this: IAnalyzerInternal,
  node: IPSRSignalBindingNode
): ISignalBindingIR {
  const signalName = node.signal.name;

  // Register signal usage
  this._registerSignal(signalName);

  // Check if signal is in scope
  const isExternal = !this._isInCurrentScope(signalName);

  // Optimization: can optimize if signal is locally declared
  const canOptimize = !isExternal && this._isSignal(signalName);

  return {
    type: IRNodeType.SIGNAL_BINDING_IR,
    signalName,
    canOptimize,
    isExternal,
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        canInline: canOptimize,
      },
      dependencies: [signalName],
    },
  };
}

/**
 * Check if identifier is in current scope
 */
function _isInCurrentScope(this: IAnalyzerInternal, name: string): boolean {
  const currentScope = this._context.scopes[0];
  return currentScope ? currentScope.variables.has(name) : false;
}

// Export helper
export { _isInCurrentScope };
