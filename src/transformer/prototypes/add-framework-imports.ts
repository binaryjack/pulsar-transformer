/**
 * Add Framework Imports - Inject import declarations at top of file
 */

import type {
  IIdentifier,
  IImportDeclaration,
  IImportSpecifier,
  IProgramNode,
  IStringLiteral,
} from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Add framework imports to top of program
 * Groups imports by category:
 * - Reactivity primitives (createSignal, useEffect, etc.)
 * - Runtime functions ($REGISTRY, t_element)
 */
export function addFrameworkImports(this: ITransformer, program: IProgramNode): void {
  const imports: IImportDeclaration[] = [];
  const usedImports = this.context.usedImports;

  // Define reactivity primitives
  const reactivityFunctions = [
    'createSignal',
    'useEffect',
    'createMemo',
    'createResource',
    'onMount',
    'onCleanup',
  ];

  // Filter to only used reactivity functions
  const usedReactivity = reactivityFunctions.filter((name) => usedImports.has(name));

  // Add reactivity imports if any used
  if (usedReactivity.length > 0) {
    const specifiers: IImportSpecifier[] = usedReactivity.map((name) => ({
      type: 'ImportSpecifier',
      imported: {
        type: 'Identifier',
        name,
        start: 0,
        end: 0,
      } as IIdentifier,
      local: {
        type: 'Identifier',
        name,
        start: 0,
        end: 0,
      } as IIdentifier,
      start: 0,
      end: 0,
    }));

    const importDecl: IImportDeclaration = {
      type: 'ImportDeclaration',
      specifiers,
      source: {
        type: 'Literal',
        value: '@pulsar-framework/pulsar.dev',
        raw: `'@pulsar-framework/pulsar.dev'`,
        start: 0,
        end: 0,
      } as IStringLiteral,
      start: 0,
      end: 0,
    };

    imports.push(importDecl);
  }

  // Define runtime functions
  const runtimeFunctions = ['$REGISTRY', 't_element'];

  // Filter to only used runtime functions
  const usedRuntime = runtimeFunctions.filter((name) => usedImports.has(name));

  // Add runtime imports if any used
  if (usedRuntime.length > 0) {
    const specifiers: IImportSpecifier[] = usedRuntime.map((name) => ({
      type: 'ImportSpecifier',
      imported: {
        type: 'Identifier',
        name,
        start: 0,
        end: 0,
      } as IIdentifier,
      local: {
        type: 'Identifier',
        name,
        start: 0,
        end: 0,
      } as IIdentifier,
      start: 0,
      end: 0,
    }));

    const importDecl: IImportDeclaration = {
      type: 'ImportDeclaration',
      specifiers,
      source: {
        type: 'Literal',
        value: '@pulsar-framework/pulsar.dev',
        raw: `'@pulsar-framework/pulsar.dev'`,
        start: 0,
        end: 0,
      } as IStringLiteral,
      start: 0,
      end: 0,
    };

    imports.push(importDecl);
  }

  // Insert imports at top of program body
  if (imports.length > 0) {
    program.body.unshift(...imports);
  }
}
