/**
 * Registry Import Injection
 * Adds necessary imports for registry-enhanced createElement
 *
 * NEW: Also adds $REGISTRY and t_element for registry pattern
 */

import * as ts from 'typescript';

/**
 * Add registry-related imports to the source file
 * Injects: $REGISTRY, t_element (new pattern)
 * Legacy: createElementWithRegistry, appendChildren, ElementType
 */
export function addRegistryImports(sourceFile: ts.SourceFile): ts.SourceFile {
  const factory = ts.factory;

  // Check if file already has registry imports
  const hasRegistryImports = sourceFile.statements.some((stmt) => {
    if (ts.isImportDeclaration(stmt)) {
      const moduleSpecifier = stmt.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        return (
          moduleSpecifier.text.includes('@pulsar-framework/pulsar.dev') &&
          stmt.importClause?.namedBindings &&
          ts.isNamedImports(stmt.importClause.namedBindings) &&
          stmt.importClause.namedBindings.elements.some(
            (el) => el.name.text === '$REGISTRY' || el.name.text === 't_element'
          )
        );
      }
    }
    return false;
  });

  if (hasRegistryImports) {
    return sourceFile; // Already has imports
  }

  // Create import for NEW registry pattern
  const registryPatternImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, factory.createIdentifier('$REGISTRY')),
        factory.createImportSpecifier(false, undefined, factory.createIdentifier('t_element')),
      ])
    ),
    factory.createStringLiteral('@pulsar-framework/pulsar.dev')
  );

  // Add imports at the beginning of the file
  return factory.updateSourceFile(
    sourceFile,
    [registryPatternImport, ...sourceFile.statements],
    sourceFile.isDeclarationFile,
    sourceFile.referencedFiles,
    sourceFile.typeReferenceDirectives,
    sourceFile.hasNoDefaultLib,
    sourceFile.libReferenceDirectives
  );
}

/**
 * Check if source file contains JSX that needs transformation
 */
export function needsRegistryTransformation(sourceFile: ts.SourceFile): boolean {
  let hasJSX = false;

  function visit(node: ts.Node): void {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      hasJSX = true;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hasJSX;
}
