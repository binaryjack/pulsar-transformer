/**
 * Add import declaration to program
 * Ensures required imports are present after transformation
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';

/**
 * Adds or updates import declaration in the program
 * If import source already exists, adds specifier
 * Otherwise creates new import declaration
 *
 * @param program - Program node path
 * @param specifier - Import specifier name (e.g., 't_element')
 * @param source - Import source (e.g., '@pulsar-framework/pulsar.dev')
 * @param t - Babel types helper
 *
 * @example
 * addImport(program, 't_element', '@pulsar-framework/pulsar.dev', t)
 * // Adds: import { t_element } from '@pulsar-framework/pulsar.dev';
 */
export function addImport(
  program: NodePath<BabelTypes.Program>,
  specifier: string,
  source: string,
  t: typeof BabelTypes
): void {
  // Check if import already exists
  const imports = program.node.body.filter((node): node is BabelTypes.ImportDeclaration =>
    t.isImportDeclaration(node)
  );

  const existingImport = imports.find((imp) => imp.source.value === source);

  if (existingImport) {
    // Check if specifier already imported
    const hasSpecifier = existingImport.specifiers.some(
      (spec) =>
        t.isImportSpecifier(spec) &&
        t.isIdentifier(spec.imported) &&
        spec.imported.name === specifier
    );

    if (!hasSpecifier) {
      existingImport.specifiers.push(
        t.importSpecifier(t.identifier(specifier), t.identifier(specifier))
      );
    }
  } else {
    // Add new import
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier(specifier), t.identifier(specifier))],
      t.stringLiteral(source)
    );
    program.node.body.unshift(importDeclaration);
  }
}
