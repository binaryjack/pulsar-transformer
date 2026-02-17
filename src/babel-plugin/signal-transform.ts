/**
 * Signal Transformation for Pulsar
 * Detects and transforms signal patterns
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';

export function createSignalTransform(t: typeof BabelTypes) {
  return {
    CallExpression(path: NodePath<BabelTypes.CallExpression>) {
      const callee = path.node.callee;

      // Transform $signal() -> createSignal()
      if (t.isIdentifier(callee) && callee.name === '$signal') {
        callee.name = 'createSignal';

        const program = path.findParent((p) => p.isProgram()) as NodePath<BabelTypes.Program>;
        addImport(program, 'createSignal', '@pulsar-framework/pulsar.dev/reactivity', t);
      }

      // Transform signal() -> createSignal()
      if (t.isIdentifier(callee) && callee.name === 'signal') {
        callee.name = 'createSignal';

        const program = path.findParent((p) => p.isProgram()) as NodePath<BabelTypes.Program>;
        addImport(program, 'createSignal', '@pulsar-framework/pulsar.dev/reactivity', t);
      }

      // Transform useState -> import from hooks
      if (t.isIdentifier(callee) && callee.name === 'useState') {
        const program = path.findParent((p) => p.isProgram()) as NodePath<BabelTypes.Program>;
        addImport(program, 'useState', '@pulsar-framework/pulsar.dev/hooks', t);
        return;
      }

      // Skip useEffect - already imported in source, avoid duplicate
      if (t.isIdentifier(callee) && callee.name === 'useEffect') {
        return;
      }
    },
  };
}

function addImport(
  program: NodePath<BabelTypes.Program>,
  specifier: string,
  source: string,
  t: typeof BabelTypes
) {
  const imports = program.node.body.filter((node): node is BabelTypes.ImportDeclaration =>
    t.isImportDeclaration(node)
  );

  const existingImport = imports.find((imp) => imp.source.value === source);

  if (existingImport) {
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
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier(specifier), t.identifier(specifier))],
      t.stringLiteral(source)
    );
    program.node.body.unshift(importDeclaration);
  }
}

