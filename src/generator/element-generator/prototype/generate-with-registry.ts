/**
 * Registry-Enhanced Element Generator
 * Generates code that automatically registers elements with the Element Registry
 */

import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { IElementGenerator } from '../element-generator.types.js';

/**
 * Generate createElementWithRegistry call instead of document.createElement
 * Includes registry context for automatic registration
 */
export const generateStaticElementWithRegistry = function (
  this: IElementGenerator,
  elementIR: IJSXElementIR
): ts.Expression {
  const factory = ts.factory;

  // Generate unique variable names
  const elementVar = `el${(this as any).varCounter++}`;
  const registryCtxVar = `__regCtx${(this as any).varCounter++}`;

  const statements: ts.Statement[] = [];

  // Build props object for createElementWithRegistry
  const propsProperties: ts.ObjectLiteralElementLike[] = [];

  // Add static properties
  elementIR.props.forEach((prop) => {
    if (prop.isStatic && prop.value) {
      // Use string literal for hyphenated property names, otherwise use identifier
      const propNameNode = prop.name.includes('-')
        ? factory.createStringLiteral(prop.name)
        : factory.createIdentifier(prop.name);

      propsProperties.push(
        factory.createPropertyAssignment(propNameNode, prop.value as ts.Expression)
      );
    }
  });

  // Create props object (can be empty)
  const propsObject = factory.createObjectLiteralExpression(propsProperties, false);

  // Build registry context object
  const registryCtxProperties: ts.ObjectLiteralElementLike[] = [];

  // Add parentId if available (from parent scope)
  registryCtxProperties.push(
    factory.createPropertyAssignment(
      factory.createIdentifier('parentId'),
      factory.createIdentifier('__parentId')
    )
  );

  // Add index (will be set by parent or default to undefined)
  registryCtxProperties.push(
    factory.createPropertyAssignment(
      factory.createIdentifier('index'),
      factory.createIdentifier('__index')
    )
  );

  // Add elementType (import ElementType from registry)
  registryCtxProperties.push(
    factory.createPropertyAssignment(
      factory.createIdentifier('elementType'),
      factory.createPropertyAccessExpression(
        factory.createIdentifier('ElementType'),
        factory.createIdentifier('COMPONENT')
      )
    )
  );

  const registryCtxObject = factory.createObjectLiteralExpression(registryCtxProperties, false);

  // Generate: createElementWithRegistry(tag, props, registryCtx)
  const createElementCall = factory.createCallExpression(
    factory.createIdentifier('createElementWithRegistry'),
    undefined,
    [factory.createStringLiteral(elementIR.tag || 'div'), propsObject, registryCtxObject]
  );

  // const el = createElementWithRegistry('div', { className: 'btn' }, {...})
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(elementVar),
            undefined,
            undefined,
            createElementCall
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // Store element ID for child context
  // const __parentId = el.__elementId
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(`${elementVar}__id`),
            undefined,
            undefined,
            factory.createPropertyAccessExpression(
              factory.createIdentifier(elementVar),
              factory.createIdentifier('__elementId')
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // Handle static text children
  if (elementIR.children && elementIR.children.length > 0) {
    const staticChildren = this.generateChildren(elementIR.children, elementVar);
    statements.push(...staticChildren);
  }

  // Return element
  statements.push(factory.createReturnStatement(factory.createIdentifier(elementVar)));

  // Wrap in IIFE: (() => { const el = createElementWithRegistry(...); return el })()
  return factory.createCallExpression(
    factory.createParenthesizedExpression(
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(statements, true)
      )
    ),
    undefined,
    []
  );
};

/**
 * Generate createElementWithRegistry call for component
 */
export const generateComponentCallWithRegistry = function (
  this: IElementGenerator,
  componentIR: any
): ts.Expression {
  const factory = ts.factory;

  // Build props object
  const propsProperties: ts.ObjectLiteralElementLike[] = [];

  // Add regular props
  componentIR.props.forEach((prop: any) => {
    if (prop.value || prop.value === false || prop.value === 0) {
      // Use string literal for hyphenated property names, otherwise use identifier
      const propNameNode = prop.name.includes('-')
        ? factory.createStringLiteral(prop.name)
        : factory.createIdentifier(prop.name);

      propsProperties.push(
        factory.createPropertyAssignment(propNameNode, prop.value as ts.Expression)
      );
    }
  });

  // Add children if present
  if (componentIR.children && componentIR.children.length > 0) {
    // Generate children elements
    const childElements = componentIR.children.map((child: any, index: number) => {
      if (child.type === 'text' && child.isStatic) {
        return factory.createStringLiteral(child.content);
      } else {
        return this.generate(child);
      }
    });

    // children: [child1, child2, ...]
    propsProperties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('children'),
        childElements.length === 1
          ? childElements[0]
          : factory.createArrayLiteralExpression(childElements, false)
      )
    );
  }

  const propsObject = factory.createObjectLiteralExpression(propsProperties, false);

  // Build registry context
  const registryCtxProperties: ts.ObjectLiteralElementLike[] = [
    factory.createPropertyAssignment(
      factory.createIdentifier('parentId'),
      factory.createIdentifier('__parentId')
    ),
    factory.createPropertyAssignment(
      factory.createIdentifier('index'),
      factory.createIdentifier('__index')
    ),
    factory.createPropertyAssignment(
      factory.createIdentifier('elementType'),
      factory.createPropertyAccessExpression(
        factory.createIdentifier('ElementType'),
        factory.createIdentifier('COMPONENT')
      )
    ),
  ];

  const registryCtxObject = factory.createObjectLiteralExpression(registryCtxProperties, false);

  // Generate: createElementWithRegistry(Component, props, registryCtx)
  return factory.createCallExpression(
    factory.createIdentifier('createElementWithRegistry'),
    undefined,
    [
      componentIR.component, // Component function reference
      propsObject,
      registryCtxObject,
    ]
  );
};
