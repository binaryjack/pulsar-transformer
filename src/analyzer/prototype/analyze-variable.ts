/**
 * Analyze Variable Declaration
 * 
 * Converts variable declaration AST to IR and tracks signals.
 */

import type { IAnalyzerInternal } from '../analyzer.types';
import type { IVariableDeclarationNode } from '../../parser/ast';
import type { IVariableDeclarationIR } from '../ir';
import { IRNodeType } from '../ir';

/**
 * Analyze variable declaration
 */
export function analyzeVariable(
  this: IAnalyzerInternal,
  node: IVariableDeclarationNode
): IVariableDeclarationIR {
  const name = node.id.name;
  const kind = node.kind;
  
  // Analyze initializer
  const initializer = node.init ? this._analyzeNode(node.init) : null;
  
  // Detect signal declaration (createSignal, createMemo, etc.)
  const isSignalDeclaration =
    initializer?.type === IRNodeType.CALL_EXPRESSION_IR &&
    (initializer as any).isSignalCreation;
  
  // Register in scope
  const currentScope = this._context.scopes[0];
  if (currentScope) {
    currentScope.variables.set(name, {
      name,
      kind,
      isSignal: isSignalDeclaration,
      declarationNode: node,
    });
  }
  
  // Register signal if detected
  if (isSignalDeclaration) {
    this._registerSignal(name);
  }
  
  return {
    type: IRNodeType.VARIABLE_DECLARATION_IR,
    kind,
    name,
    initializer,
    isSignalDeclaration,
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        isStatic: !isSignalDeclaration,
      },
      dependencies: isSignalDeclaration ? [name] : [],
    },
  };
}
