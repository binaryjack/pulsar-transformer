/**
 * Component Wrapper Generator
 * Wraps component functions with $REGISTRY.execute() for lifecycle management
 */

import * as ts from 'typescript';
import type { ITransformationContext } from '../../context/transformation-context.types.js';
import type { IComponentDefinition } from '../../parser/component-detector.js';

/**
 * Generate a stable component ID from component name and file path
 * Format: filename:ComponentName
 * Example: "app.tsx:TodoItem"
 */
function generateComponentId(
  componentName: string,
  sourceFile: ts.SourceFile,
  context: ITransformationContext
): string {
  const fileName = sourceFile.fileName;
  const baseName =
    fileName
      .split(/[/\\]/)
      .pop()
      ?.replace(/\.(tsx?|jsx?)$/, '') || 'unknown';
  return `${baseName}:${componentName}`;
}

/**
 * Generate a stable HID for each element
 * Returns expression: $REGISTRY.nextHid()
 */
function generateHidExpression(context: ITransformationContext): ts.CallExpression {
  const factory = context.factory;
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier('$REGISTRY'),
      factory.createIdentifier('nextHid')
    ),
    undefined,
    []
  );
}

/**
 * Wrap component body with $REGISTRY.execute()
 *
 * Input:
 * ```ts
 * const TodoItem = (props): HTMLElement => {
 *   return <div>...</div>
 * }
 * ```
 *
 * Output:
 * ```ts
 * const TodoItem = (props): HTMLElement => {
 *   return $REGISTRY.execute('app:TodoItem', () => {
 *     return <div>...</div>
 *   })
 * }
 * ```
 */
export function wrapComponentWithExecute(
  component: IComponentDefinition,
  sourceFile: ts.SourceFile,
  context: ITransformationContext
): ts.Node {
  const factory = context.factory;
  const componentId = generateComponentId(component.name, sourceFile, context);

  // Generate the wrapped body
  const wrappedBody = wrapBodyWithExecute(component.body, componentId, factory, context);

  // Case 1: Arrow function in variable declaration
  if (component.isArrowFunction && ts.isVariableDeclaration(component.node.parent)) {
    const arrowFunc = component.node as ts.ArrowFunction;
    const varDecl = component.node.parent as ts.VariableDeclaration;

    // Create new arrow function with wrapped body
    const newArrowFunc = factory.createArrowFunction(
      arrowFunc.modifiers,
      arrowFunc.typeParameters,
      arrowFunc.parameters,
      arrowFunc.type,
      arrowFunc.equalsGreaterThanToken,
      wrappedBody
    );

    // Return new variable declaration with wrapped arrow function
    return factory.createVariableDeclaration(
      varDecl.name,
      varDecl.exclamationToken,
      varDecl.type,
      newArrowFunc
    );
  }

  // Case 2: Function declaration
  if (component.isFunctionDeclaration) {
    const funcDecl = component.node as ts.FunctionDeclaration;

    return factory.createFunctionDeclaration(
      funcDecl.modifiers,
      funcDecl.asteriskToken,
      funcDecl.name,
      funcDecl.typeParameters,
      funcDecl.parameters,
      funcDecl.type,
      wrappedBody as ts.Block
    );
  }

  // Fallback: return original node
  return component.node;
}

/**
 * Wrap function body with $REGISTRY.execute()
 */
function wrapBodyWithExecute(
  body: ts.Block | ts.Expression | undefined,
  componentId: string,
  factory: ts.NodeFactory,
  context: ITransformationContext
): ts.Block | ts.Expression {
  if (!body) {
    // No body - return empty block
    return factory.createBlock([], false);
  }

  // For arrow functions with expression body: () => <div>...</div>
  if (ts.isExpression(body)) {
    // Wrap in $REGISTRY.execute()
    const executeCall = factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('$REGISTRY'),
        factory.createIdentifier('execute')
      ),
      undefined,
      [
        factory.createStringLiteral(componentId),
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          body
        ),
      ]
    );

    return executeCall;
  }

  // For function bodies with block: () => { return <div>...</div> }
  if (ts.isBlock(body)) {
    // Find return statement and wrap its expression
    const statements = body.statements.map((stmt) => {
      if (ts.isReturnStatement(stmt) && stmt.expression) {
        // Wrap return expression in $REGISTRY.execute()
        const executeCall = factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier('$REGISTRY'),
            factory.createIdentifier('execute')
          ),
          undefined,
          [
            factory.createStringLiteral(componentId),
            factory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              stmt.expression
            ),
          ]
        );

        return factory.createReturnStatement(executeCall);
      }
      return stmt;
    });

    return factory.createBlock(statements, true);
  }

  return body;
}

/**
 * Check if a component should be wrapped
 * Only wrap if useRegistryPattern is enabled in config
 */
export function shouldWrapComponent(
  component: IComponentDefinition,
  context: ITransformationContext
): boolean {
  const config = context.config;
  return config?.useRegistryPattern === true;
}

/**
 * Add data-hid to JSX element for SSR hydration
 * This is done during element generation, not component wrapping
 * See generate-registry-element.ts for implementation
 */
