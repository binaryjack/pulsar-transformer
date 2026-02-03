/**
 * Element Transform Strategy Prototype Methods
 */

import ts from 'typescript';
import type { IElementIR, IIRNode } from '../../../analyzer/ir/ir-node-types.js';
import type { ITransformContext } from '../transform-strategy.types.js';
import { ElementTransformStrategy } from './element-transform-strategy.js';
import type { IElementTransformStrategyInternal } from './element-transform-strategy.types.js';

export function canTransform(
  this: IElementTransformStrategyInternal,
  node: IIRNode
): node is IElementIR {
  return node.type === 'ElementIR';
}

export function transform(
  this: IElementTransformStrategyInternal,
  node: IElementIR,
  context: ITransformContext
): ts.Node[] {
  const domCreation = this.transformToDOM(node, context);
  const children = this.generateChildren(node, context);

  return [ts.factory.createExpressionStatement(domCreation), ...children];
}

export function getImports(
  this: IElementTransformStrategyInternal,
  node: IElementIR
): Map<string, Set<string>> {
  const imports = new Map<string, Set<string>>();

  // If has signal bindings, need createEffect
  if (node.signalBindings.length > 0) {
    imports.set('@pulsar/core', new Set(['createEffect']));
  }

  return imports;
}

export function transformToDOM(
  this: IElementTransformStrategyInternal,
  element: IElementIR,
  context: ITransformContext
): ts.Expression {
  if (element.isStatic) {
    return this.generateStaticElement(element, context);
  } else {
    return this.generateDynamicElement(element, context);
  }
}

export function generateStaticElement(
  this: IElementTransformStrategyInternal,
  element: IElementIR,
  context: ITransformContext
): ts.Expression {
  // document.createElement('div')
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier('document'),
      ts.factory.createIdentifier('createElement')
    ),
    undefined,
    [ts.factory.createStringLiteral(element.tagName)]
  );
}

export function generateDynamicElement(
  this: IElementTransformStrategyInternal,
  element: IElementIR,
  context: ITransformContext
): ts.Expression {
  // Same as static for now, reactivity added via signal bindings
  return this.generateStaticElement(element, context);
}

export function generateChildren(
  this: IElementTransformStrategyInternal,
  element: IElementIR,
  context: ITransformContext
): ts.Statement[] {
  const statements: ts.Statement[] = [];

  // Generate children append statements
  for (const child of element.children) {
    // Placeholder: will be expanded later
    statements.push(
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('element'),
            ts.factory.createIdentifier('appendChild')
          ),
          undefined,
          [ts.factory.createIdentifier('child')]
        )
      )
    );
  }

  return statements;
}

// Attach methods
ElementTransformStrategy.prototype.canTransform = canTransform;
ElementTransformStrategy.prototype.transform = transform;
ElementTransformStrategy.prototype.getImports = getImports;
ElementTransformStrategy.prototype.transformToDOM = transformToDOM;
ElementTransformStrategy.prototype.generateStaticElement = generateStaticElement;
ElementTransformStrategy.prototype.generateDynamicElement = generateDynamicElement;
ElementTransformStrategy.prototype.generateChildren = generateChildren;

Object.defineProperties(ElementTransformStrategy.prototype, {
  canTransform: { enumerable: false },
  transform: { enumerable: false },
  getImports: { enumerable: false },
  transformToDOM: { enumerable: false },
  generateStaticElement: { enumerable: false },
  generateDynamicElement: { enumerable: false },
  generateChildren: { enumerable: false },
});
