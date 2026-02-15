/**
 * Pulsar Babel Plugin
 * Main entry point for Babel-based PSR transformation
 */

import type * as BabelTypes from '@babel/types';
import { createComponentTransform } from './component-transform.js';
import { createControlFlowTransform } from './control-flow-transform.js';
import { createJSXTransform } from './jsx-transform.js';
import { createSignalTransform } from './signal-transform.js';

interface PluginAPI {
  types: typeof BabelTypes;
}

interface PluginObj {
  name: string;
  visitor: Record<string, any>;
}

export default function pulsarBabelPlugin(api: PluginAPI): PluginObj {
  const t = api.types;
  const controlFlowTransform = createControlFlowTransform(t);
  const jsxTransform = createJSXTransform(t);
  const componentTransform = createComponentTransform(t);
  const signalTransform = createSignalTransform(t);

  return {
    name: 'pulsar-transform',
    visitor: {
      // IMPORTANT: Order matters!
      // 1. Component transform (wraps components BEFORE JSX is transformed)
      // 2. Control flow (transforms Show/For/etc BEFORE generic JSX)
      // 3. JSX transform (transforms all remaining JSX)
      // 4. Signal transform (adds imports)

      Program: {
        enter(path: any) {
          // First pass: Wrap components with $REGISTRY.execute()
          path.traverse({
            ExportNamedDeclaration: componentTransform.ExportNamedDeclaration,
          });

          // Second pass: Transform control flow components
          path.traverse({
            JSXElement: controlFlowTransform.JSXElement,
          });
        },
        exit(path: any) {
          // Sort import specifiers alphabetically for consistent output
          path.node.body.forEach((node: any) => {
            if (t.isImportDeclaration(node)) {
              node.specifiers.sort((a: any, b: any) => {
                const aName =
                  t.isImportSpecifier(a) && t.isIdentifier(a.imported) ? a.imported.name : '';
                const bName =
                  t.isImportSpecifier(b) && t.isIdentifier(b.imported) ? b.imported.name : '';
                return aName.localeCompare(bName);
              });
            }
          });
        },
      },

      // JSX transformations (after component wrap and control flow)
      JSXElement: jsxTransform.JSXElement,
      JSXFragment: jsxTransform.JSXFragment,

      // Signal transformations
      CallExpression: signalTransform.CallExpression,
    },
  };
}
