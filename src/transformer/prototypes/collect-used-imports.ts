/**
 * Collect Used Imports - Traverse AST and track function usage
 */

import type { IASTNode } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Recursively traverse AST and collect used framework functions
 * Detects:
 * - Reactivity primitives (createSignal, useEffect, etc.)
 * - Runtime functions ($REGISTRY, t_element)
 */
export function collectUsedImports(this: ITransformer, node: IASTNode): void {
  if (!node) return;

  // Check for reactivity function calls
  if (node.type === 'CallExpression') {
    const callee = (node as any).callee;
    if (callee && callee.type === 'Identifier') {
      const name = callee.name;
      const reactivityFunctions = [
        'createSignal',
        'useEffect',
        'createMemo',
        'createResource',
        'onMount',
        'onCleanup',
      ];

      if (reactivityFunctions.includes(name)) {
        this.context.usedImports.add(name);
      }
    }
  }

  // Check for JSX - means we need t_element
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
    this.context.usedImports.add('t_element');
  }

  // Check for component declarations - means we need $REGISTRY
  if (node.type === 'ComponentDeclaration') {
    this.context.usedImports.add('$REGISTRY');
  }

  // Recursively traverse child nodes
  for (const key in node) {
    const child = (node as any)[key];
    if (child && typeof child === 'object') {
      if (Array.isArray(child)) {
        child.forEach((item) => {
          if (item && typeof item === 'object' && item.type) {
            this.collectUsedImports(item);
          }
        });
      } else if (child.type) {
        this.collectUsedImports(child);
      }
    }
  }
}
