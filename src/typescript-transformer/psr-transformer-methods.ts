/**
 * PSR Transformer Utility Methods - Prototype extensions
 * Pattern: Utility functions for transformation operations
 */

import * as ts from 'typescript';
import type { IPSRTransformer } from './psr-transformer.types.js';
import { TransformationPhaseEnum } from './transformation-tracker.types.js';

/**
 * Transform JSX self-closing element
 */
export function transformJSXSelfClosingElement(
  this: IPSRTransformer,
  node: ts.JsxSelfClosingElement
): ts.CallExpression {
  const tagName = this.getJSXTagName(node);
  const stepId = `jsx-self-${tagName}-${++this.transformationCount!}`;

  if (this.tracker) {
    this.tracker.startStep(
      stepId,
      `Transform JSX self-closing: ${tagName}`,
      TransformationPhaseEnum.JSX_TRANSFORM,
      'JsxSelfClosingElement'
    );
  }

  this.addFrameworkImport('t_element');

  const attributes = this.transformJSXAttributes(node.attributes);
  const emptyChildren = ts.factory.createArrayLiteralExpression([]);

  const tElementCall = this.createTElementCall(tagName, attributes, emptyChildren);

  if (this.tracker) {
    this.tracker.completeStep(stepId, 'CallExpression (t_element self-closing)');
  }

  return tElementCall;
}

/**
 * Transform JSX fragment
 */
export function transformJSXFragment(
  this: IPSRTransformer,
  node: ts.JsxFragment
): ts.CallExpression {
  const stepId = `jsx-fragment-${++this.transformationCount!}`;

  if (this.tracker) {
    this.tracker.startStep(
      stepId,
      'Transform JSX fragment',
      TransformationPhaseEnum.JSX_TRANSFORM,
      'JsxFragment'
    );
  }

  this.addFrameworkImport('t_element');

  const children = this.transformJSXChildren(node.children);
  const fragmentCall = this.createTElementCall(
    'Fragment',
    ts.factory.createObjectLiteralExpression([]),
    children
  );

  if (this.tracker) {
    this.tracker.completeStep(stepId, 'CallExpression (Fragment)');
  }

  return fragmentCall;
}

/**
 * Transform control flow component (ShowRegistry, ForRegistry, etc.)
 */
export function transformControlFlowComponent(
  this: IPSRTransformer,
  node: ts.JsxElement
): ts.Expression {
  const tagName = this.getJSXTagName(node);

  switch (tagName) {
    case 'ShowRegistry':
      return this.transformShowComponent(node);
    case 'ForRegistry':
      return this.transformForComponent(node);
    case 'Index':
      return this.transformIndexComponent(node);
    default:
      // Default to regular JSX transformation
      return this.transformJSXElement(node);
  }
}

/**
 * Transform ShowRegistry component to conditional expression
 */
export function transformShowComponent(
  this: IPSRTransformer,
  node: ts.JsxElement
): ts.ConditionalExpression {
  const stepId = `show-component-${++this.transformationCount!}`;

  if (this.tracker) {
    this.tracker.startStep(
      stepId,
      'Transform ShowRegistry component',
      TransformationPhaseEnum.CONTROL_FLOW,
      'JsxElement (ShowRegistry)'
    );
  }

  // Get 'when' attribute
  const whenAttr = this.getJSXAttributeValue(node, 'when');
  if (!whenAttr) {
    throw new Error('ShowRegistry component requires "when" attribute');
  }

  // Get 'fallback' attribute (optional)
  const fallbackAttr = this.getJSXAttributeValue(node, 'fallback');
  const fallbackExpression = fallbackAttr || ts.factory.createNull();

  // Transform children
  const childrenArray = this.transformJSXChildren(node.children);

  // Create conditional: when ? children : fallback
  const conditionalExpression = ts.factory.createConditionalExpression(
    whenAttr,
    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
    childrenArray,
    ts.factory.createToken(ts.SyntaxKind.ColonToken),
    fallbackExpression
  );

  if (this.tracker) {
    this.tracker.completeStep(stepId, 'ConditionalExpression', { hasFallback: !!fallbackAttr });
  }

  return conditionalExpression;
}

/**
 * Transform style object to style string
 */
export function transformStyleObject(
  this: IPSRTransformer,
  node: ts.ObjectLiteralExpression
): ts.StringLiteral {
  const stepId = `style-object-${++this.transformationCount!}`;

  if (this.tracker) {
    this.tracker.startStep(
      stepId,
      'Transform style object',
      TransformationPhaseEnum.STYLE_OBJECTS,
      'ObjectLiteralExpression'
    );
  }

  const styleProperties: string[] = [];

  for (const property of node.properties) {
    if (ts.isPropertyAssignment(property)) {
      const styleRule = this.transformStyleProperty(property);
      if (styleRule) {
        styleProperties.push(styleRule);
      }
    }
  }

  const styleString = styleProperties.join('; ');
  const styleLiteral = ts.factory.createStringLiteral(styleString);

  if (this.tracker) {
    this.tracker.completeStep(stepId, 'StringLiteral', {
      propertyCount: styleProperties.length,
      styleString,
    });
  }

  return styleLiteral;
}

/**
 * Transform style property to CSS string
 */
export function transformStyleProperty(
  this: IPSRTransformer,
  property: ts.PropertyAssignment
): string | null {
  // Get property name
  let propertyName: string;
  if (ts.isIdentifier(property.name)) {
    propertyName = property.name.text;
  } else if (ts.isStringLiteral(property.name)) {
    propertyName = property.name.text;
  } else {
    return null; // Skip computed properties
  }

  // Convert camelCase to kebab-case
  const cssPropertyName = propertyName.replace(/([A-Z])/g, '-$1').toLowerCase();

  // Get property value
  let propertyValue: string;
  if (ts.isStringLiteral(property.initializer)) {
    propertyValue = property.initializer.text;
  } else if (ts.isNumericLiteral(property.initializer)) {
    // Add 'px' for numeric values (common CSS pattern)
    propertyValue = property.initializer.text + 'px';
  } else if (ts.isCallExpression(property.initializer)) {
    // Handle reactive values like color() - preserve as template literal
    return `${cssPropertyName}: \${${property.initializer.getText()}}`;
  } else {
    // For other expressions, preserve as template literal
    return `${cssPropertyName}: \${${property.initializer.getText()}}`;
  }

  return `${cssPropertyName}: ${propertyValue}`;
}

/**
 * Transform JSX attributes to object expression
 */
export function transformJSXAttributes(
  this: IPSRTransformer,
  attributes: ts.JsxAttributes
): ts.ObjectLiteralExpression {
  const properties: ts.ObjectLiteralElementLike[] = [];

  for (const attr of attributes.properties) {
    if (ts.isJsxAttribute(attr) && attr.name) {
      const name = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.name.text;
      let value: ts.Expression;

      if (attr.initializer) {
        if (ts.isStringLiteral(attr.initializer)) {
          value = attr.initializer;
        } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
          value = attr.initializer.expression;
        } else {
          value = ts.factory.createTrue(); // Boolean attribute
        }
      } else {
        value = ts.factory.createTrue(); // Boolean attribute
      }

      properties.push(ts.factory.createPropertyAssignment(name, value));
    }
  }

  return ts.factory.createObjectLiteralExpression(properties);
}

/**
 * Transform JSX children to array expression
 */
export function transformJSXChildren(
  this: IPSRTransformer,
  children: ts.NodeArray<ts.JsxChild>
): ts.ArrayLiteralExpression {
  const elements: ts.Expression[] = [];

  for (const child of children) {
    if (ts.isJsxText(child)) {
      const text = child.text.trim();
      if (text) {
        elements.push(ts.factory.createStringLiteral(text));
      }
    } else if (ts.isJsxExpression(child) && child.expression) {
      elements.push(child.expression);
    } else if (ts.isJsxElement(child)) {
      elements.push(this.transformJSXElement(child));
    } else if (ts.isJsxSelfClosingElement(child)) {
      elements.push(this.transformJSXSelfClosingElement(child));
    } else if (ts.isJsxFragment(child)) {
      elements.push(this.transformJSXFragment(child));
    }
  }

  return ts.factory.createArrayLiteralExpression(elements);
}

/**
 * Create $REGISTRY.execute call
 */
export function createRegistryExecuteCall(
  this: IPSRTransformer,
  componentId: string,
  bodyFunction: ts.ArrowFunction
): ts.CallExpression {
  const registryAccess = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier('$REGISTRY'),
    'execute'
  );

  const componentIdLiteral = ts.factory.createStringLiteral(componentId);

  return ts.factory.createCallExpression(
    registryAccess,
    undefined,
    [componentIdLiteral, bodyFunction] // 2 arguments: id, bodyFunction
  );
}

/**
 * Create t_element call
 */
export function createTElementCall(
  this: IPSRTransformer,
  tagName: string,
  attributes: ts.Expression,
  children: ts.Expression
): ts.CallExpression {
  return ts.factory.createCallExpression(ts.factory.createIdentifier('t_element'), undefined, [
    ts.factory.createStringLiteral(tagName),
    attributes,
    children,
  ]);
}

/**
 * Get JSX attribute value by name
 */
export function getJSXAttributeValue(
  this: IPSRTransformer,
  element: ts.JsxElement | ts.JsxSelfClosingElement,
  attributeName: string
): ts.Expression | undefined {
  const attributes =
    'openingElement' in element ? element.openingElement.attributes : element.attributes;

  for (const attr of attributes.properties) {
    if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name) && attr.name.text === attributeName) {
      if (attr.initializer) {
        if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
          return attr.initializer.expression;
        } else if (ts.isStringLiteral(attr.initializer)) {
          return attr.initializer;
        }
      }
      return ts.factory.createTrue();
    }
  }

  return undefined;
}

/**
 * Add framework import
 */
export function addFrameworkImport(this: IPSRTransformer, importName: string): void {
  this.imports!.add(importName);

  if (this.tracker) {
    this.tracker.addImport(importName);
  }
}

/**
 * Inject framework imports at top of source file
 */
export function injectImports(this: IPSRTransformer, sourceFile: ts.SourceFile): ts.SourceFile {
  if (this.imports!.size === 0) {
    return sourceFile;
  }

  const stepId = `inject-imports-${++this.transformationCount!}`;

  if (this.tracker) {
    this.tracker.startStep(
      stepId,
      'Inject framework imports',
      TransformationPhaseEnum.IMPORT_MANAGEMENT,
      'SourceFile'
    );
  }

  // Create import declaration
  const importSpecifiers = Array.from(this.imports!).map((name) =>
    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
  );

  const importDeclaration = ts.factory.createImportDeclaration(
    undefined, // modifiers
    ts.factory.createImportClause(
      false,
      undefined, // default import
      ts.factory.createNamedImports(importSpecifiers)
    ),
    ts.factory.createStringLiteral(this.options!.frameworkImportPath!)
  );

  // Prepend import to statements
  const statements = [importDeclaration, ...sourceFile.statements];

  const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, statements);

  if (this.tracker) {
    this.tracker.completeStep(stepId, 'SourceFile (with imports)', {
      importCount: this.imports!.size,
      imports: Array.from(this.imports!),
    });
  }

  return updatedSourceFile;
}
