/**
 * Shared utility for injecting pulsar framework imports
 * Ensures consistency across single-file and project-level transformers
 */
import * as ts from 'typescript';

/**
 * Add $REGISTRY and t_element imports to a source file if not already present
 * @param sourceFile - The source file to inject imports into
 * @returns Modified source file with imports injected
 */
export function addPulsarImports(sourceFile: ts.SourceFile): ts.SourceFile {
  // Check if $REGISTRY import already exists
  const hasRegistryImport = sourceFile.statements.some(
    (stmt) =>
      ts.isImportDeclaration(stmt) &&
      stmt.moduleSpecifier &&
      ts.isStringLiteral(stmt.moduleSpecifier) &&
      stmt.moduleSpecifier.text === '@pulsar-framework/pulsar.dev' &&
      stmt.importClause?.namedBindings &&
      ts.isNamedImports(stmt.importClause.namedBindings) &&
      stmt.importClause.namedBindings.elements.some((el) => el.name.text === '$REGISTRY')
  );

  // Check if t_element import exists
  const hasTElementImport = sourceFile.statements.some(
    (stmt) =>
      ts.isImportDeclaration(stmt) &&
      stmt.moduleSpecifier &&
      ts.isStringLiteral(stmt.moduleSpecifier) &&
      stmt.moduleSpecifier.text === '@pulsar-framework/pulsar.dev' &&
      stmt.importClause?.namedBindings &&
      ts.isNamedImports(stmt.importClause.namedBindings) &&
      stmt.importClause.namedBindings.elements.some((el) => el.name.text === 't_element')
  );

  if (hasRegistryImport && hasTElementImport) {
    return sourceFile;
  }

  // Create import statement: import { $REGISTRY, t_element } from '@pulsar-framework/pulsar.dev';
  const pulsarImport = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier('$REGISTRY')
        ),
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier('t_element')
        ),
      ])
    ),
    ts.factory.createStringLiteral('@pulsar-framework/pulsar.dev'),
    undefined
  );

  // Add import at the beginning
  const statements = [pulsarImport, ...sourceFile.statements];

  return ts.factory.updateSourceFile(sourceFile, statements);
}
