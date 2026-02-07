/**
 * Analyze Variable Declaration
 *
 * Converts variable declaration AST to IR and tracks signals.
 */

import type { IVariableDeclarationNode } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { IVariableDeclarationIR } from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze variable declaration
 */
export function analyzeVariable(
  this: IAnalyzerInternal,
  node: IVariableDeclarationNode
): IVariableDeclarationIR {
  // Access first declaration in array
  const declaration = node.declarations[0];
  const id = declaration.id as any;
  const kind = node.kind;

  // Handle both simple identifiers and destructuring patterns
  let name: string;
  let isDestructuring = false;
  let destructuringNames: string[] = [];

  if (id.type === 'ArrayPattern') {
    // Array destructuring: const [a, b] = value
    isDestructuring = true;
    destructuringNames = id.elements.map((el: any) => el.name);
    name = destructuringNames[0]; // Use first element as primary name
  } else {
    // Simple identifier: const x = value
    name = id.name;
  }

  // Analyze initializer
  const initializer = declaration.init ? this._analyzeNode(declaration.init) : null;

  // Preserve type annotation
  const typeAnnotation = declaration.typeAnnotation
    ? {
        type: 'TypeAnnotation' as const,
        typeString: declaration.typeAnnotation.typeString,
      }
    : undefined;

  // Detect signal declaration (createSignal, createMemo, etc.)
  const isSignalDeclaration =
    initializer?.type === IRNodeType.CALL_EXPRESSION_IR && (initializer as any).isSignalCreation;

  // Register in scope
  const currentScope = this._context.scopes[0];
  if (currentScope) {
    if (isDestructuring) {
      // Register all destructured names
      destructuringNames.forEach((varName) => {
        currentScope.variables.set(varName, {
          name: varName,
          kind,
          isSignal: isSignalDeclaration,
          declarationNode: node,
        });
      });
    } else {
      // Register single variable
      currentScope.variables.set(name, {
        name,
        kind,
        isSignal: isSignalDeclaration,
        declarationNode: node,
      });
    }
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
    typeAnnotation,
    isSignalDeclaration,
    isDestructuring,
    destructuringNames,
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        isStatic: !isSignalDeclaration,
      },
      dependencies: isSignalDeclaration ? [name] : [],
    },
  } as IVariableDeclarationIR;
}
