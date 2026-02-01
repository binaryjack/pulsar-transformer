/**
 * Element generator - Creates transformed JSX element code
 * Complete implementation with all attribute types and child handling
 */

import * as ts from 'typescript';
import { factory } from 'typescript';
import { createExpressionClassifier } from '../detector/expression-classifier.js';
import {
  IElementGenerator,
  IEventCall,
  IExpressionClassifier,
  IGeneratedElement,
  ITransformContext,
  IWireCall,
} from '../types.js';

/**
 * Create element generator
 */
export function createElementGenerator(context: ITransformContext): IElementGenerator {
  const classifier = createExpressionClassifier(context);

  const generator: IElementGenerator = {
    generateElement(element): IGeneratedElement {
      if (ts.isJsxSelfClosingElement(element)) {
        return generateSelfClosingElement(element, context, classifier);
      } else {
        return generateFullElement(element, context, classifier);
      }
    },

    generateFragment(fragment): IGeneratedElement {
      return generateFragmentElement(fragment, context, classifier);
    },

    generateComponent(component): IGeneratedElement {
      // Component calls are handled differently - they return the component function call
      const tagName = getTagName(component);

      if (isCustomComponent(tagName)) {
        return generateComponentCall(component, context, classifier);
      }

      // Fallback to regular element
      return generator.generateElement(component);
    },
  };

  return generator;
}

/**
 * Generate self-closing element
 */
function generateSelfClosingElement(
  element: ts.JsxSelfClosingElement,
  context: ITransformContext,
  classifier: IExpressionClassifier
): IGeneratedElement {
  const tagName = element.tagName.getText();
  const statements: ts.Statement[] = [];
  const wires: IWireCall[] = [];
  const events: IEventCall[] = [];
  const requiredImports = new Set<string>();

  const varName = generateVariableName(context);

  // Create element: const el1 = document.createElement('div')
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(varName),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('document'),
                factory.createIdentifier('createElement')
              ),
              undefined,
              [factory.createStringLiteral(tagName)]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // Process attributes
  element.attributes.properties.forEach((prop) => {
    if (ts.isJsxAttribute(prop)) {
      processAttribute(prop, varName, statements, wires, events, context, classifier);
    } else if (ts.isJsxSpreadAttribute(prop)) {
      processSpreadAttribute(prop, varName, statements, wires, context, classifier);
    }
  });

  return {
    statements,
    variableName: varName,
    requiredImports,
    wires,
    events,
    children: [],
  };
}

/**
 * Generate full element with children
 */
function generateFullElement(
  element: ts.JsxElement,
  context: ITransformContext,
  classifier: IExpressionClassifier
): IGeneratedElement {
  const tagName = element.openingElement.tagName.getText();
  const statements: ts.Statement[] = [];
  const wires: IWireCall[] = [];
  const events: IEventCall[] = [];
  const children: IGeneratedElement[] = [];
  const requiredImports = new Set<string>();

  const varName = generateVariableName(context);

  // Create element
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(varName),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('document'),
                factory.createIdentifier('createElement')
              ),
              undefined,
              [factory.createStringLiteral(tagName)]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // Process attributes
  element.openingElement.attributes.properties.forEach((prop) => {
    if (ts.isJsxAttribute(prop)) {
      processAttribute(prop, varName, statements, wires, events, context, classifier);
    } else if (ts.isJsxSpreadAttribute(prop)) {
      processSpreadAttribute(prop, varName, statements, wires, context, classifier);
    }
  });

  // Process children
  element.children.forEach((child) => {
    if (ts.isJsxText(child)) {
      const text = child.text.trim();
      if (text) {
        statements.push(createTextContentStatement(varName, text));
      }
    } else if (ts.isJsxExpression(child) && child.expression) {
      processChildExpression(
        child.expression,
        varName,
        statements,
        wires,
        children,
        context,
        classifier
      );
    } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      // Recursively generate child
      const gen = createElementGenerator(context);
      const childElement = gen.generateElement(child);
      children.push(childElement);

      // Add child statements
      statements.push(...childElement.statements);
      statements.push(...childElement.wires.map((w: any) => createWireStatement(w)));
      statements.push(...childElement.events.map((e: any) => createEventStatement(e)));

      // Append child
      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(varName),
              factory.createIdentifier('appendChild')
            ),
            undefined,
            [factory.createIdentifier(childElement.variableName)]
          )
        )
      );
    } else if (ts.isJsxFragment(child)) {
      const fragmentElement = generateFragmentElement(child, context, classifier);
      children.push(fragmentElement);
      statements.push(...fragmentElement.statements);
    }
  });

  return {
    statements,
    variableName: varName,
    tagName,
    requiredImports,
    wires,
    events,
    children,
  };
}

/**
 * Generate fragment element
 */
function generateFragmentElement(
  fragment: ts.JsxFragment,
  context: ITransformContext,
  classifier: IExpressionClassifier
): IGeneratedElement {
  const statements: ts.Statement[] = [];
  const wires: IWireCall[] = [];
  const events: IEventCall[] = [];
  const children: IGeneratedElement[] = [];
  const requiredImports = new Set<string>();

  const varName = generateVariableName(context);

  // Create document fragment
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(varName),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('document'),
                factory.createIdentifier('createDocumentFragment')
              ),
              undefined,
              []
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // Process fragment children
  fragment.children.forEach((child) => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const gen = createElementGenerator(context);
      const childElement = gen.generateElement(child);
      children.push(childElement);

      statements.push(...childElement.statements);
      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(varName),
              factory.createIdentifier('appendChild')
            ),
            undefined,
            [factory.createIdentifier(childElement.variableName)]
          )
        )
      );
    }
  });

  return {
    statements,
    variableName: varName,
    requiredImports,
    wires,
    events,
    children,
  };
}

/**
 * Generate component call
 */
function generateComponentCall(
  component: ts.JsxElement | ts.JsxSelfClosingElement,
  context: ITransformContext,
  classifier: IExpressionClassifier
): IGeneratedElement {
  const tagName = getTagName(component);
  const statements: ts.Statement[] = [];
  const requiredImports = new Set<string>();
  const varName = generateVariableName(context);

  // Build props object
  const attributes = ts.isJsxSelfClosingElement(component)
    ? component.attributes
    : component.openingElement.attributes;

  const propsProperties: ts.ObjectLiteralElementLike[] = [];

  attributes.properties.forEach((prop) => {
    if (ts.isJsxAttribute(prop)) {
      const propName = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.name.text;
      let value: ts.Expression;

      if (!prop.initializer) {
        value = factory.createTrue();
      } else if (ts.isJsxExpression(prop.initializer)) {
        value = prop.initializer.expression || factory.createIdentifier('undefined');
      } else {
        value = prop.initializer;
      }

      propsProperties.push(
        factory.createPropertyAssignment(factory.createIdentifier(propName), value)
      );
    }
  });

  // Component call: const el1 = ComponentName({ prop1: value1 })
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(varName),
            undefined,
            undefined,
            factory.createCallExpression(factory.createIdentifier(tagName), undefined, [
              factory.createObjectLiteralExpression(propsProperties, true),
            ])
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  return {
    statements,
    variableName: varName,
    requiredImports,
    wires: [],
    events: [],
    children: [],
  };
}

/**
 * Process JSX attribute
 */
function processAttribute(
  attr: ts.JsxAttribute,
  elementVar: string,
  statements: ts.Statement[],
  wires: IWireCall[],
  events: IEventCall[],
  context: ITransformContext,
  classifier: IExpressionClassifier
): void {
  const attrName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.name.text;

  if (!attr.initializer) {
    // Boolean attribute: <div disabled />
    statements.push(createAttributeStatement(elementVar, attrName, factory.createTrue()));
    return;
  }

  let expression: ts.Expression;

  if (ts.isJsxExpression(attr.initializer)) {
    if (!attr.initializer.expression) return;
    expression = attr.initializer.expression;
  } else if (ts.isStringLiteral(attr.initializer)) {
    expression = attr.initializer;
  } else {
    return;
  }

  // Classify expression
  const classification = classifier.classify(expression);

  if (classification.type === 'event') {
    // Event handler
    const eventName = attrName.replace(/^on/, '').toLowerCase();
    const eventCall: IEventCall = {
      element: elementVar,
      eventName,
      handler: expression,
    };
    events.push(eventCall);
    // Event statement will be added by transformJsxElement from events array
  } else if (classification.requiresWire) {
    // Dynamic attribute
    const wire: IWireCall = {
      element: elementVar,
      property: normalizeAttributeName(attrName),
      getter: factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        expression
      ),
      dependencies: classifier.getSignalDependencies(expression),
      comment: classification.reason,
    };
    wires.push(wire);
    // Wire statement will be added by transformJsxElement from wires array
  } else {
    // Static attribute
    statements.push(createAttributeStatement(elementVar, attrName, expression));
  }
}

/**
 * Process spread attribute
 */
function processSpreadAttribute(
  spread: ts.JsxSpreadAttribute,
  elementVar: string,
  statements: ts.Statement[],
  wires: IWireCall[],
  context: ITransformContext,
  classifier: IExpressionClassifier
): void {
  // Object.assign(el, props)
  statements.push(
    factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier('Object'),
          factory.createIdentifier('assign')
        ),
        undefined,
        [factory.createIdentifier(elementVar), spread.expression]
      )
    )
  );
}

/**
 * Process child expression
 */
function processChildExpression(
  expression: ts.Expression,
  parentVar: string,
  statements: ts.Statement[],
  wires: IWireCall[],
  children: IGeneratedElement[],
  context: ITransformContext,
  classifier: IExpressionClassifier
): void {
  const classification = classifier.classify(expression);

  if (classification.requiresWire) {
    // Dynamic text content - need to transform any nested JSX in the expression
    // Visit the expression recursively to transform nested JSX (e.g., in .map() callbacks)
    const visitNode = (node: ts.Node): ts.Node => {
      // Transform nested JSX elements
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const gen = createElementGenerator(context);
        const generated = gen.generateElement(node);
        // Return the IIFE that creates the element
        return factory.createCallExpression(
          factory.createParenthesizedExpression(
            factory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              factory.createBlock(
                generated.statements.concat([
                  factory.createReturnStatement(factory.createIdentifier(generated.variableName)),
                ]),
                true
              )
            )
          ),
          undefined,
          []
        );
      }
      // Recursively visit children
      return ts.visitEachChild(node, visitNode, undefined);
    };

    const transformedExpression = ts.visitNode(expression, visitNode) as ts.Expression;

    const wire: IWireCall = {
      element: parentVar,
      property: 'textContent',
      getter: factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        transformedExpression
      ),
      dependencies: classifier.getSignalDependencies(expression),
    };
    wires.push(wire);
    // Wire statement will be added by transformJsxElement from wires array
  } else {
    // Static text content
    statements.push(
      factory.createExpressionStatement(
        factory.createBinaryExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier(parentVar),
            factory.createIdentifier('textContent')
          ),
          factory.createToken(ts.SyntaxKind.PlusEqualsToken),
          expression
        )
      )
    );
  }
}

/**
 * Helper functions
 */

function generateVariableName(context: ITransformContext): string {
  return `el${++context.varCounter}`;
}

function getTagName(element: ts.JsxElement | ts.JsxSelfClosingElement): string {
  if (ts.isJsxSelfClosingElement(element)) {
    return element.tagName.getText();
  }
  return element.openingElement.tagName.getText();
}

function isCustomComponent(tagName: string): boolean {
  // Custom components start with uppercase
  return /^[A-Z]/.test(tagName);
}

function normalizeAttributeName(name: string): string {
  // Handle special attribute names
  if (name === 'className') return 'className';
  if (name === 'htmlFor') return 'htmlFor';
  return name;
}

function createAttributeStatement(
  elementVar: string,
  attrName: string,
  value: ts.Expression
): ts.Statement {
  return factory.createExpressionStatement(
    factory.createBinaryExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(elementVar),
        factory.createIdentifier(normalizeAttributeName(attrName))
      ),
      factory.createToken(ts.SyntaxKind.EqualsToken),
      value
    )
  );
}

function createWireStatement(wire: IWireCall): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('$REGISTRY'),
        factory.createIdentifier('wire')
      ),
      undefined,
      [
        factory.createIdentifier(wire.element),
        factory.createStringLiteral(wire.property),
        wire.getter,
      ]
    )
  );
}

function createEventStatement(event: IEventCall): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(event.element),
        factory.createIdentifier('addEventListener')
      ),
      undefined,
      [factory.createStringLiteral(event.eventName), event.handler]
    )
  );
}

function createTextContentStatement(elementVar: string, text: string): ts.Statement {
  return factory.createExpressionStatement(
    factory.createBinaryExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(elementVar),
        factory.createIdentifier('textContent')
      ),
      factory.createToken(ts.SyntaxKind.EqualsToken),
      factory.createStringLiteral(text)
    )
  );
}

// Export generator for use in other modules
const generator = createElementGenerator;
export { generator };
