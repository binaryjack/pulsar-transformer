/**
 * Registry Import Injection
 * Adds necessary imports for registry-enhanced createElement
 */

import * as ts from 'typescript';

/**
 * Add registry-related imports to the source file
 * Injects: createElementWithRegistry, appendChildren, ElementType
 */
export function addRegistryImports(sourceFile: ts.SourceFile): ts.SourceFile {
  const factory = ts.factory;

  // Check if file already has registry imports
  const hasRegistryImports = sourceFile.statements.some((stmt) => {
    if (ts.isImportDeclaration(stmt)) {
      const moduleSpecifier = stmt.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        return (
          moduleSpecifier.text.includes('@pulsar-framework/pulsar.dev/jsx-runtime') ||
          moduleSpecifier.text.includes('@pulsar-framework/pulsar.dev/registry')
        );
      }
    }
    return false;
  });

  if (hasRegistryImports) {
    return sourceFile; // Already has imports
  }

  // Create import for createElementWithRegistry and appendChildren
  const jsxRuntimeImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier('createElementWithRegistry')
        ),
        factory.createImportSpecifier(false, undefined, factory.createIdentifier('appendChildren')),
      ])
    ),
    factory.createStringLiteral('@pulsar-framework/pulsar.dev/jsx-runtime')
  );

  // Create import for ElementType
  const registryTypesImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, factory.createIdentifier('ElementType')),
      ])
    ),
    factory.createStringLiteral('@pulsar-framework/pulsar.dev/registry')
  );

  // Add imports at the beginning of the file
  return factory.updateSourceFile(
    sourceFile,
    [jsxRuntimeImport, registryTypesImport, ...sourceFile.statements],
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
