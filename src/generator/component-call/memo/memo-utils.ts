/**
 * Component Memoization System
 *
 * Provides utilities for detecting and configuring component memoization
 */

import * as ts from 'typescript';

/**
 * Check if a component has @pulsar-no-memo pragma
 */
export function hasNoMemoPragma(node: ts.Node): boolean {
  const jsDocTags = ts.getJSDocTags(node);
  return jsDocTags.some((tag) => tag.tagName.text === 'pulsar-no-memo');
}

/**
 * Check if a component has @pulsar-memo pragma with options
 */
export function getMemoPragmaOptions(node: ts.Node): {
  enabled: boolean;
  deep?: boolean;
  debug?: boolean;
} {
  const jsDocTags = ts.getJSDocTags(node);

  // Check for @pulsar-no-memo
  const noMemo = jsDocTags.find((tag) => tag.tagName.text === 'pulsar-no-memo');
  if (noMemo) {
    return { enabled: false };
  }

  // Check for @pulsar-memo with options
  const memoTag = jsDocTags.find((tag) => tag.tagName.text === 'pulsar-memo');
  if (memoTag && memoTag.comment) {
    const comment =
      typeof memoTag.comment === 'string'
        ? memoTag.comment
        : memoTag.comment.map((c) => c.text).join('');

    return {
      enabled: true,
      deep: comment.includes('deep'),
      debug: comment.includes('debug'),
    };
  }

  // Default: enabled
  return { enabled: true };
}

/**
 * Check if file has any imports from a specific module
 */
export function hasImportFrom(
  sourceFile: ts.SourceFile,
  moduleName: string,
  importName?: string
): boolean {
  let found = false;

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === moduleName) {
        if (!importName) {
          found = true;
          return;
        }

        const namedBindings = node.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          found = namedBindings.elements.some((el) => el.name.text === importName);
        }
      }
    }
  });

  return found;
}

/**
 * Generate import declaration for memoization utilities
 */
export function createMemoImports(factory: ts.NodeFactory): {
  createEffectImport: ts.ImportDeclaration;
  shallowEqualImport: ts.ImportDeclaration;
} {
  return {
    createEffectImport: factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(false, undefined, factory.createIdentifier('createEffect')),
        ])
      ),
      factory.createStringLiteral('@pulsar-framework/pulsar.dev'),
      undefined
    ),

    shallowEqualImport: factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(false, undefined, factory.createIdentifier('shallowEqual')),
        ])
      ),
      factory.createStringLiteral('@pulsar-framework/pulsar.dev'),
      undefined
    ),
  };
}
