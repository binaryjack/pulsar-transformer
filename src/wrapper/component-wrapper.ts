/**
 * Component wrapper - Wraps components in $REGISTRY.execute() calls
 * Complete implementation with full component type support
 */

import * as ts from 'typescript';
import { factory } from 'typescript';
import { IComponentDeclaration, IComponentWrapper, ITransformContext } from '../types.js';
import { generateFileHash } from '../utils/file-hash.js';

/**
 * Create component wrapper
 */
export function createComponentWrapper(context: ITransformContext): IComponentWrapper {
  const wrapper: IComponentWrapper = {
    wrapComponent(declaration: IComponentDeclaration): ts.Statement {
      const componentId = wrapper.generateComponentId(declaration.name);

      // Get component body
      let bodyStatements: ts.Statement[];

      if (Array.isArray(declaration.body)) {
        bodyStatements = declaration.body;
      } else {
        // Expression body - wrap in return statement
        bodyStatements = [factory.createReturnStatement(declaration.body)];
      }

      // Create factory function for registry (with NO parameters - it's a closure over the outer function's params)
      const factoryFunction = factory.createArrowFunction(
        undefined,
        undefined,
        [], // No parameters - uses closure
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(bodyStatements, true)
      );

      // Create $REGISTRY.execute call
      const registryCall = wrapper.generateRegistryCall(componentId, factoryFunction);

      // Wrap the registry call in a function that accepts the component's original parameters
      // Result: (props) => $REGISTRY.execute("id", null, () => { ...use props... })
      const componentFunction = factory.createArrowFunction(
        undefined,
        undefined,
        declaration.parameters, // Keep original parameters
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        registryCall // Return the execute call directly
      );

      // Wrap based on declaration type
      if (ts.isFunctionDeclaration(declaration.node)) {
        return wrapFunctionDeclaration(declaration.node, componentFunction);
      } else if (ts.isVariableDeclaration(declaration.node)) {
        return wrapVariableDeclaration(declaration.node, componentFunction);
      } else if (ts.isArrowFunction(declaration.node)) {
        return wrapArrowFunction(declaration.name, componentFunction);
      }

      throw new Error(
        `Unsupported component declaration type: ${(declaration.node as any).kind || 'unknown'}`
      );
    },

    wrapComponentBody(body: ts.Statement[], componentId: string): ts.Block {
      const factoryFunction = factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(body, true)
      );

      const registryCall = wrapper.generateRegistryCall(componentId, factoryFunction);

      return factory.createBlock([factory.createReturnStatement(registryCall)], true);
    },

    generateComponentId(componentName: string): string {
      const callIndex = getCallIndex(componentName, context);
      return `${context.fileHash}:${componentName}:${callIndex}`;
    },

    generateRegistryCall(componentId: string, factory: ts.ArrowFunction): ts.CallExpression {
      // Mark that $REGISTRY is used
      context.requiresRegistry = true;

      return ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('$REGISTRY'),
          ts.factory.createIdentifier('execute')
        ),
        undefined,
        [
          ts.factory.createStringLiteral(componentId),
          ts.factory.createNull(), // parentId
          factory,
        ]
      );
    },
  };

  return wrapper;
}

/**
 * Wrap function declaration
 */
function wrapFunctionDeclaration(
  original: ts.FunctionDeclaration,
  componentFunction: ts.ArrowFunction
): ts.Statement {
  return factory.createFunctionDeclaration(
    original.modifiers,
    original.asteriskToken,
    original.name,
    original.typeParameters,
    original.parameters,
    original.type,
    factory.createBlock([factory.createReturnStatement(componentFunction)], true)
  );
}

/**
 * Wrap variable declaration
 */
function wrapVariableDeclaration(
  original: ts.VariableDeclaration,
  componentFunction: ts.ArrowFunction
): ts.Statement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          original.name,
          undefined,
          original.type,
          componentFunction
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

/**
 * Wrap arrow function
 */
function wrapArrowFunction(name: string, componentFunction: ts.ArrowFunction): ts.Statement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(name),
          undefined,
          undefined,
          componentFunction
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

/**
 * Get and increment call index for component
 */
function getCallIndex(componentName: string, context: ITransformContext): number {
  const current = context.componentIndex.get(componentName) || 0;
  context.componentIndex.set(componentName, current + 1);
  return current;
}

/**
 * Export the hash function for reuse
 */
export { generateFileHash };
