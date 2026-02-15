/**
 * Component Transformation for Pulsar
 * Handles component keyword and registry wrapping
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';

export function createComponentTransform(t: typeof BabelTypes) {
  return {
    ExportNamedDeclaration(path: NodePath<BabelTypes.ExportNamedDeclaration>) {
      const declaration = path.node.declaration;

      if (!declaration) {
        return;
      }

      // Handle function declarations: export function Counter() { ... }
      if (t.isFunctionDeclaration(declaration)) {
        if (t.isIdentifier(declaration.id) && /^[A-Z]/.test(declaration.id.name)) {
          const componentName = declaration.id.name;
          const originalBody = declaration.body;

          // Add HTMLElement return type if not present
          if (!declaration.returnType) {
            declaration.returnType = t.tsTypeAnnotation(
              t.tsTypeReference(t.identifier('HTMLElement'))
            );
          }

          // Create wrapper: return $REGISTRY.execute('component:Name', null, () => { ...original body... })
          const arrowFn = t.arrowFunctionExpression([], originalBody);
          const registryCall = t.callExpression(
            t.memberExpression(t.identifier('$REGISTRY'), t.identifier('execute')),
            [t.stringLiteral(`component:${componentName}`), t.nullLiteral(), arrowFn]
          );
          const returnStatement = t.returnStatement(registryCall);

          // Replace body with wrapper
          declaration.body = t.blockStatement([returnStatement]);

          // Add $REGISTRY import
          const program = path.findParent((p) => p.isProgram()) as NodePath<BabelTypes.Program>;
          addRegistryImport(program, t);
        }
        return;
      }

      // Handle variable declarations
      if (t.isVariableDeclaration(declaration)) {
        for (const declarator of declaration.declarations) {
          if (
            t.isVariableDeclarator(declarator) &&
            t.isIdentifier(declarator.id) &&
            /^[A-Z]/.test(declarator.id.name)
          ) {
            const componentName = declarator.id.name;

            // Pattern 1: export const Badge = () => { ... }
            if (t.isArrowFunctionExpression(declarator.init)) {
              const originalArrow = declarator.init;

              // Add HTMLElement return type if not present
              if (!originalArrow.returnType) {
                originalArrow.returnType = t.tsTypeAnnotation(
                  t.tsTypeReference(t.identifier('HTMLElement'))
                );
              }

              // Wrap arrow body in $REGISTRY.execute()
              const innerArrow = t.arrowFunctionExpression(
                [],
                t.isBlockStatement(originalArrow.body)
                  ? originalArrow.body
                  : t.blockStatement([
                      t.returnStatement(originalArrow.body as BabelTypes.Expression),
                    ])
              );
              const registryCall = t.callExpression(
                t.memberExpression(t.identifier('$REGISTRY'), t.identifier('execute')),
                [t.stringLiteral(`component:${componentName}`), t.nullLiteral(), innerArrow]
              );

              // Replace arrow body with return $REGISTRY.execute(...)
              // Preserve return type annotation if present
              const newArrow = t.arrowFunctionExpression(
                originalArrow.params,
                t.blockStatement([t.returnStatement(registryCall)]),
                originalArrow.async
              );

              // Copy return type annotation
              if (originalArrow.returnType) {
                newArrow.returnType = originalArrow.returnType;
              }

              declarator.init = newArrow;

              // Add $REGISTRY import
              const program = path.findParent((p) => p.isProgram()) as NodePath<BabelTypes.Program>;
              addRegistryImport(program, t);
            }
            // Pattern 2: export const X = component(() => { ... })
            // Skip transformation - let component() remain unchanged
            // JSX inside will be transformed naturally by jsx-transform.ts
            else if (
              t.isCallExpression(declarator.init) &&
              t.isIdentifier(declarator.init.callee) &&
              declarator.init.callee.name === 'component'
            ) {
              // No transformation needed - component() is a pass-through
              return;
            }
          }
        }
      }
    },
  };
}

function addRegistryImport(program: NodePath<BabelTypes.Program>, t: typeof BabelTypes) {
  const imports = program.node.body.filter((node): node is BabelTypes.ImportDeclaration =>
    t.isImportDeclaration(node)
  );

  const pulsarPath = '@pulsar-framework/pulsar.dev';
  const existingImport = imports.find((imp) => imp.source.value === pulsarPath);

  if (existingImport) {
    // Add $REGISTRY to existing import
    const hasRegistry = existingImport.specifiers.some(
      (spec) =>
        t.isImportSpecifier(spec) &&
        spec.imported.type === 'Identifier' &&
        spec.imported.name === '$REGISTRY'
    );
    if (!hasRegistry) {
      existingImport.specifiers.push(
        t.importSpecifier(t.identifier('$REGISTRY'), t.identifier('$REGISTRY'))
      );
    }
  } else {
    // Create new import
    const importDecl = t.importDeclaration(
      [t.importSpecifier(t.identifier('$REGISTRY'), t.identifier('$REGISTRY'))],
      t.stringLiteral(pulsarPath)
    );
    program.node.body.unshift(importDecl);
  }
}
